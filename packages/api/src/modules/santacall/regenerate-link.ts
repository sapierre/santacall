import { EmailTemplate } from "@turbostarter/email";
import { sendEmail } from "@turbostarter/email/server";
import { HttpStatusCode } from "@turbostarter/shared/constants";
import { HttpException } from "@turbostarter/shared/utils";

import { env } from "./env";
import {
  updateOrder,
  generateDeliveryToken,
  createLinkRegeneration,
  createConversation,
  updateConversation,
} from "./mutations";
import { getOrderById } from "./queries";

/**
 * Convert interests array into a natural, conversational phrase
 */
const describeInterests = (list: string[]): string => {
  if (list.length === 0) return "all the things you enjoy";
  if (list.length === 1) return `your love for ${list[0]!.replace(/_/g, " ")}`;
  const items = list.map((i) => i.replace(/_/g, " "));
  const last = items.pop()!;
  return `${items.join(", ")} and ${last}`;
};

/**
 * Rephrase/clean user-provided text
 */
const rephrase = (text: string | null): string | null => {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").replace(/[:;]+/g, ",").trim();
  return cleaned.length > 80 ? cleaned.slice(0, 80).trimEnd() + "…" : cleaned;
};

/**
 * Generate Santa conversation context for live calls
 */
const generateSantaContext = (data: {
  children: { name: string; age: number }[];
  interests: string[];
  excitedGift: string | null;
  specialMessage: string | null;
}): string => {
  const interestsDescription = describeInterests(data.interests);
  const wish = rephrase(data.excitedGift ?? data.specialMessage);
  const wishDescription = wish ?? "not provided";

  const childrenInfo =
    data.children.length === 1
      ? `Child: ${data.children[0]!.name}, age ${data.children[0]!.age}.`
      : `Children: ${data.children.map((c) => `${c.name} (age ${c.age})`).join(", ")}.`;

  const greetingExample =
    data.children.length === 1
      ? `"Ho ho ho! Well hello there, ${data.children[0]!.name}!"`
      : data.children.length === 2
        ? `"Ho ho ho! Hello ${data.children[0]!.name} and ${data.children[1]!.name}!"`
        : `"Ho ho ho! Hello everyone!"`;

  const shyGreeting =
    data.children.length === 1
      ? `"Ho ho ho! Is that ${data.children[0]!.name} I see?"`
      : `"Ho ho ho! Are those wonderful children I see?"`;

  const closingExample =
    data.children.length === 1
      ? `"Well ${data.children[0]!.name}, Santa has to get back to the workshop soon..."`
      : `"Well children, Santa has to get back to the workshop soon..."`;

  return `
${childrenInfo}
Interests (rephrase naturally): ${interestsDescription}.
Wishlist hint (rephrase, do NOT repeat verbatim): ${wishDescription}.

IMPORTANT - WAIT FOR GREETING:
- When the call starts, WAIT for the ${data.children.length > 1 ? "children" : "child"} to greet you first (e.g., "Hi Santa", "Hello", etc.)
- Do NOT start speaking immediately - pause for 1-2 seconds to let them settle in
- Once they greet you, respond warmly with ${greetingExample}
- If they seem shy or don't speak after ~5 seconds, gently say ${shyGreeting}
${data.children.length > 1 ? `- Address each child by name during the conversation to make it personal for everyone` : ""}

GUIDELINES:
- Be warm, jolly Santa - use "Ho ho ho!" naturally
- Keep language simple (ages 3-12)
- Ask about their interests and Christmas wishes conversationally
- Rephrase interests and wishes naturally - do NOT repeat them verbatim
- Encourage kindness and good behavior
${data.children.length > 1 ? `- Make sure to engage with all ${data.children.length} children, not just one` : ""}
${data.children.length > 1 ? `- If one child dominates, gently bring others in: "And what about you, [name]?"` : ""}
- Call duration: ~3 minutes total

CALL PACING - VERY IMPORTANT:
- The call is approximately 3 minutes long
- After about 2 minutes, start wrapping up naturally - do NOT start new questions or topics
- When wrapping up, say something like: ${closingExample}
- End with warm holiday wishes: "Remember to be good, and have a very Merry Christmas! Ho ho ho!"
- Do NOT end the call abruptly mid-conversation - always give a proper goodbye
- If ${data.children.length > 1 ? "a child asks" : "the child asks"} a new question late in the call, give a brief answer then transition to goodbye

CRITICAL GUARDRAILS:
- Do NOT promise specific gifts or visits
- If they mention wishes, acknowledge warmly but say "I can't promise anything, but I love hearing what makes you happy!"
- Avoid scary topics (naughty list punishments, etc.)
- Keep it positive and magical
- End with warm holiday wishes
  `.trim();
};

/**
 * Create a new Tavus conversation for a call order (live now - no scheduling)
 */
const createNewTavusConversation = async (
  order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>,
): Promise<string> => {
  // Parse interests and children
  const interests = order.interests
    ? (JSON.parse(order.interests) as string[])
    : [];

  const children = order.children
    ? (JSON.parse(order.children) as { name: string; age: number }[])
    : [{ name: order.childName, age: order.childAge }];

  const childrenNames = children.map((c) => c.name).join(", ");

  // Create conversation record
  const conversation = await createConversation({
    orderId: order.id,
    status: "scheduled",
    scheduledAt: new Date(), // Set to now for immediate availability
  });

  if (!conversation) {
    throw new HttpException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
      code: "error.conversation_creation_failed",
      message: "Failed to create conversation record",
    });
  }

  // Create Tavus conversation via API
  const tavusResponse = await fetch("https://tavusapi.com/v2/conversations", {
    method: "POST",
    headers: {
      "x-api-key": env.TAVUS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      persona_id: env.TAVUS_PERSONA_ID,
      conversation_name: `Santa Call for ${childrenNames} - ${order.orderNumber} (Regenerated)`,
      conversational_context: generateSantaContext({
        children,
        interests,
        excitedGift: order.excitedGift,
        specialMessage: order.specialMessage,
      }),
      callback_url: `${env.NEXT_PUBLIC_APP_URL}/api/santacall/webhook/tavus?secret=${env.TAVUS_WEBHOOK_SECRET}`,
    }),
  });

  if (!tavusResponse.ok) {
    const errorText = await tavusResponse.text();
    await updateConversation(conversation.id, {
      status: "cancelled",
      errorMessage: `Tavus API error: ${tavusResponse.status} - ${errorText}`,
    });
    throw new HttpException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
      code: "error.tavus_api_failed",
      message: `Failed to create Tavus conversation: ${errorText}`,
    });
  }

  const tavusData = (await tavusResponse.json()) as {
    conversation_id: string;
    conversation_url: string;
  };

  // Update conversation with Tavus data
  await updateConversation(conversation.id, {
    tavusConversationId: tavusData.conversation_id,
    roomUrl: tavusData.conversation_url,
  });

  console.log(
    `New Tavus conversation created for order ${order.orderNumber}, Tavus ID: ${tavusData.conversation_id}`,
  );

  return tavusData.conversation_url;
};

/**
 * Regenerate delivery link for an order
 * Admin-only function to generate a new delivery token and send updated link to customer
 * For call orders: Creates a new Tavus conversation that's available immediately
 */
export const regenerateOrderLink = async (orderId: string) => {
  // Fetch the order
  const order = await getOrderById(orderId);

  if (!order) {
    throw new HttpException(HttpStatusCode.NOT_FOUND, {
      code: "error.order_not_found",
    });
  }

  // Only regenerate links for paid orders with delivery URLs
  if (order.status !== "ready" && order.status !== "delivered") {
    throw new HttpException(HttpStatusCode.BAD_REQUEST, {
      code: "error.order_not_ready",
      message: "Can only regenerate links for ready or delivered orders",
    });
  }

  if (!order.deliveryUrl) {
    throw new HttpException(HttpStatusCode.BAD_REQUEST, {
      code: "error.no_delivery_url",
      message: "Order does not have a delivery URL to regenerate link for",
    });
  }

  // Save the previous token before generating new one
  const previousToken = order.deliveryToken ?? "";

  // Generate new delivery token
  const newDeliveryToken = generateDeliveryToken();

  // For call orders, create a new Tavus conversation
  let newDeliveryUrl = order.deliveryUrl;
  if (order.orderType === "call") {
    try {
      newDeliveryUrl = await createNewTavusConversation(order);
    } catch (error) {
      console.error(`Failed to create new Tavus conversation:`, error);
      throw error;
    }
  }

  // Update the order with new token and delivery URL (if changed)
  // For call orders, also update scheduledAt to now so the call window check passes
  const updatedOrder = await updateOrder(orderId, {
    deliveryToken: newDeliveryToken,
    deliveryUrl: newDeliveryUrl,
    status: "ready", // Reset to ready so they can use the new link
    ...(order.orderType === "call" && { scheduledAt: new Date() }),
  });

  if (!updatedOrder) {
    throw new HttpException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
      code: "error.update_failed",
    });
  }

  // Construct the new view URL
  const viewUrl = `${env.NEXT_PUBLIC_APP_URL}/order/${order.orderNumber}?token=${newDeliveryToken}`;

  // Send email notification with new link
  let emailSent = false;
  try {
    await sendEmail({
      to: order.customerEmail,
      template: EmailTemplate.SANTACALL_LINK_REGENERATED,
      variables: {
        customerName: order.customerName,
        childName: order.childName,
        viewUrl,
        orderType: order.orderType,
      },
    });
    emailSent = true;
    console.log(
      `Link regenerated and email sent to ${order.customerEmail} for order ${order.orderNumber}`,
    );
  } catch (emailError) {
    console.error(`Failed to send regenerated link email:`, emailError);
    // Don't fail the operation - link was regenerated successfully
  }

  // Log the regeneration to history table
  await createLinkRegeneration({
    orderId,
    previousToken,
    newToken: newDeliveryToken,
    newViewUrl: viewUrl,
    emailSent,
  });

  return {
    success: true,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    newToken: newDeliveryToken,
    viewUrl,
    emailSent,
  };
};
