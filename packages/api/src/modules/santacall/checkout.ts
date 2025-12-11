import Stripe from "stripe";

import { EmailTemplate } from "@turbostarter/email";
import { sendEmail } from "@turbostarter/email/server";
import { HttpStatusCode } from "@turbostarter/shared/constants";
import { HttpException } from "@turbostarter/shared/utils";

import { env } from "./env";
import { createOrder, generateDeliveryToken } from "./mutations";
import { getOrderByStripeSessionId, getOrderByPaymentIntentId } from "./queries";

import type { CreateBookingInput } from "../../schema";

// Lazy-init Stripe client
let stripeInstance: Stripe | null = null;
const stripe = () => {
  stripeInstance ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripeInstance;
};

// Product prices from env (server-side only, ignore client prices)
const getPrice = (orderType: "video" | "call"): number => {
  return orderType === "video"
    ? env.SANTACALL_VIDEO_PRICE_CENTS
    : env.SANTACALL_CALL_PRICE_CENTS;
};

/**
 * Create a Stripe Checkout session for a SantaCall order
 * - Creates pending order in DB
 * - Returns Stripe checkout URL
 */
export const createCheckoutSession = async (input: CreateBookingInput) => {
  const priceInCents = getPrice(input.orderType);
  const deliveryToken = generateDeliveryToken();

  // Create pending order in database
  const order = await createOrder({
    orderType: input.orderType,
    status: "pending",
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    childName: input.childName,
    childAge: input.childAge,
    interests: input.interests ? JSON.stringify(input.interests) : null,
    excitedGift: input.excitedGift ?? null,
    specialMessage: input.specialMessage ?? null,
    scheduledAt: input.orderType === "call" ? input.scheduledAt : null,
    timezone: input.orderType === "call" ? input.timezone : null,
    deliveryToken,
  });

  if (!order) {
    throw new HttpException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
      code: "santacall:error.orderCreationFailed",
    });
  }

  // Create Stripe Checkout session
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: input.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name:
              input.orderType === "video"
                ? `Personalized Santa Video for ${input.childName}`
                : `Live Santa Call for ${input.childName}`,
            description:
              input.orderType === "video"
                ? "A magical personalized video message from Santa Claus"
                : "A live 3-minute video call with Santa Claus",
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: input.orderType,
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/order/${order.orderNumber}?token=${deliveryToken}&status=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/book?canceled=true`,
  });

  // Update order with Stripe session ID
  await import("./mutations").then((m) =>
    m.updateOrder(order.id, { stripeSessionId: session.id }),
  );

  if (!session.url) {
    throw new HttpException(HttpStatusCode.INTERNAL_SERVER_ERROR, {
      code: "santacall:error.checkoutUrlMissing",
    });
  }

  return {
    checkoutUrl: session.url,
    orderId: order.id,
    orderNumber: order.orderNumber,
  };
};

/**
 * Handle Stripe webhook for checkout.session.completed
 * - Verifies signature
 * - Updates order to paid status
 * - Triggers video generation or conversation scheduling
 */
export const handleStripeWebhook = async (req: Request) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    throw new HttpException(HttpStatusCode.BAD_REQUEST, {
      code: "santacall:error.webhookSignatureMissing",
    });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_SANTACALL_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    throw new HttpException(HttpStatusCode.BAD_REQUEST, {
      code: "santacall:error.webhookSignatureInvalid",
    });
  }

  // Replay protection: check timestamp (5 minute window)
  const eventTime = event.created * 1000;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  if (now - eventTime > fiveMinutes) {
    console.warn("Stripe webhook event too old, possible replay attack");
    throw new HttpException(HttpStatusCode.BAD_REQUEST, {
      code: "santacall:error.webhookEventExpired",
    });
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * Process completed checkout session
 */
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const { orderId, orderType } = session.metadata ?? {};

  if (!orderId || !orderType) {
    console.error("Missing order metadata in checkout session");
    return;
  }

  // Idempotency check: if payment intent already processed, skip
  const paymentIntentId = session.payment_intent as string | null;
  if (paymentIntentId) {
    const existingOrder = await getOrderByPaymentIntentId(paymentIntentId);
    if (existingOrder && existingOrder.status !== "pending") {
      console.log(`Order ${orderId} already processed, skipping`);
      return;
    }
  }

  // Get the order
  const order = await getOrderByStripeSessionId(session.id);
  if (!order) {
    console.error(`Order not found for session ${session.id}`);
    return;
  }

  // Update order to paid status
  const { updateOrder } = await import("./mutations");
  await updateOrder(order.id, {
    status: "paid",
    stripePaymentIntentId: paymentIntentId,
    amountPaid: session.amount_total,
    currency: session.currency,
  });

  console.log(`Order ${order.orderNumber} marked as paid`);

  // Send order confirmation email
  try {
    const orderUrl = `${env.NEXT_PUBLIC_APP_URL}/order/${order.orderNumber}?token=${order.deliveryToken}`;
    const amountPaid = session.amount_total
      ? `$${(session.amount_total / 100).toFixed(2)}`
      : "N/A";

    let scheduledAtFormatted: string | undefined;
    if (order.orderType === "call" && order.scheduledAt) {
      scheduledAtFormatted = order.scheduledAt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: order.timezone ?? "UTC",
      });
    }

    await sendEmail({
      to: order.customerEmail,
      template: EmailTemplate.SANTACALL_ORDER_CONFIRMATION,
      variables: {
        customerName: order.customerName,
        childName: order.childName,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        amountPaid,
        scheduledAt: scheduledAtFormatted,
        timezone: order.timezone ?? undefined,
        orderUrl,
      },
    });
    console.log(`Order confirmation email sent to ${order.customerEmail}`);
  } catch (emailError) {
    console.error(`Failed to send order confirmation email:`, emailError);
    // Don't fail - email is non-critical
  }

  // Trigger next step based on order type
  if (orderType === "video") {
    await triggerVideoGeneration(order.id);
  } else if (orderType === "call") {
    await scheduleConversation(order.id);
  }
};

/**
 * Trigger Tavus video generation for a video order
 */
const triggerVideoGeneration = async (orderId: string) => {
  const { createVideoJob, updateOrder } = await import("./mutations");
  const { getOrderById } = await import("./queries");

  const order = await getOrderById(orderId);
  if (!order) {
    console.error(`Order ${orderId} not found for video generation`);
    return;
  }

  // Create video job record
  const videoJob = await createVideoJob({
    orderId,
    status: "queued",
    retryCount: 0,
  });

  if (!videoJob) {
    console.error(`Failed to create video job for order ${orderId}`);
    await updateOrder(orderId, {
      status: "failed",
      errorMessage: "Failed to create video job",
    });
    return;
  }

  // Update order status to processing
  await updateOrder(orderId, { status: "processing" });

  // Parse interests
  const interests = order.interests
    ? (JSON.parse(order.interests) as string[])
    : [];

  // Call Tavus API to generate video
  try {
    const tavusResponse = await fetch("https://tavusapi.com/v2/videos", {
      method: "POST",
      headers: {
        "x-api-key": env.TAVUS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replica_id: env.TAVUS_REPLICA_ID,
        script: generateSantaScript({
          childName: order.childName,
          childAge: order.childAge,
          interests,
          excitedGift: order.excitedGift,
          specialMessage: order.specialMessage,
        }),
        video_name: `Santa Video for ${order.childName} - ${order.orderNumber}`,
        callback_url: `${env.NEXT_PUBLIC_APP_URL}/api/santacall/webhook/tavus?secret=${env.TAVUS_WEBHOOK_SECRET}`,
      }),
    });

    if (!tavusResponse.ok) {
      const errorText = await tavusResponse.text();
      throw new Error(`Tavus API error: ${tavusResponse.status} - ${errorText}`);
    }

    const tavusData = (await tavusResponse.json()) as { video_id: string };

    // Update video job with Tavus video ID
    const { updateVideoJob } = await import("./mutations");
    await updateVideoJob(videoJob.id, {
      tavusVideoId: tavusData.video_id,
      status: "processing",
    });

    console.log(
      `Video generation started for order ${order.orderNumber}, Tavus video ID: ${tavusData.video_id}`,
    );
  } catch (error) {
    console.error(`Failed to trigger video generation for order ${orderId}:`, error);

    const { updateVideoJob, updateOrder } = await import("./mutations");
    await updateVideoJob(videoJob.id, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await updateOrder(orderId, {
      status: "failed",
      errorMessage: "Video generation failed",
    });
  }
};

/**
 * Schedule a Tavus conversation for a call order
 */
const scheduleConversation = async (orderId: string) => {
  const { createConversation, updateOrder } = await import("./mutations");
  const { getOrderById } = await import("./queries");

  const order = await getOrderById(orderId);
  if (!order || !order.scheduledAt) {
    console.error(`Order ${orderId} not found or missing scheduledAt`);
    return;
  }

  // Create conversation record
  const conversation = await createConversation({
    orderId,
    status: "scheduled",
    scheduledAt: order.scheduledAt,
  });

  if (!conversation) {
    console.error(`Failed to create conversation for order ${orderId}`);
    await updateOrder(orderId, {
      status: "failed",
      errorMessage: "Failed to create conversation",
    });
    return;
  }

  // Parse interests
  const interests = order.interests
    ? (JSON.parse(order.interests) as string[])
    : [];

  // Create Tavus conversation
  try {
    const tavusResponse = await fetch(
      "https://tavusapi.com/v2/conversations",
      {
        method: "POST",
        headers: {
          "x-api-key": env.TAVUS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona_id: env.TAVUS_PERSONA_ID,
          conversation_name: `Santa Call for ${order.childName} - ${order.orderNumber}`,
          conversational_context: generateSantaContext({
            childName: order.childName,
            childAge: order.childAge,
            interests,
            excitedGift: order.excitedGift,
            specialMessage: order.specialMessage,
          }),
          callback_url: `${env.NEXT_PUBLIC_APP_URL}/api/santacall/webhook/tavus?secret=${env.TAVUS_WEBHOOK_SECRET}`,
        }),
      },
    );

    if (!tavusResponse.ok) {
      const errorText = await tavusResponse.text();
      throw new Error(`Tavus API error: ${tavusResponse.status} - ${errorText}`);
    }

    const tavusData = (await tavusResponse.json()) as {
      conversation_id: string;
      conversation_url: string;
    };

    // Update conversation with Tavus data
    const { updateConversation } = await import("./mutations");
    await updateConversation(conversation.id, {
      tavusConversationId: tavusData.conversation_id,
      roomUrl: tavusData.conversation_url,
    });

    // Update order with room URL
    await updateOrder(orderId, {
      status: "ready",
      deliveryUrl: tavusData.conversation_url,
    });

    console.log(
      `Conversation scheduled for order ${order.orderNumber}, Tavus conversation ID: ${tavusData.conversation_id}`,
    );

    // Send call link email to customer
    try {
      const joinUrl = `${env.NEXT_PUBLIC_APP_URL}/order/${order.orderNumber}?token=${order.deliveryToken}`;
      const scheduledAtFormatted = order.scheduledAt!.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: order.timezone ?? "UTC",
      });

      await sendEmail({
        to: order.customerEmail,
        template: EmailTemplate.SANTACALL_CALL_LINK,
        variables: {
          customerName: order.customerName,
          childName: order.childName,
          joinUrl,
          scheduledAt: scheduledAtFormatted,
          timezone: order.timezone ?? "UTC",
        },
      });
      console.log(`Call link email sent to ${order.customerEmail}`);
    } catch (emailError) {
      console.error(`Failed to send call link email:`, emailError);
      // Don't fail - email is non-critical
    }
  } catch (error) {
    console.error(`Failed to schedule conversation for order ${orderId}:`, error);

    const { updateConversation, updateOrder } = await import("./mutations");
    await updateConversation(conversation.id, {
      status: "cancelled",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await updateOrder(orderId, {
      status: "failed",
      errorMessage: "Conversation scheduling failed",
    });
  }
};

/**
 * Convert interests array into a natural, conversational phrase
 * Avoids verbatim echo of the raw list
 */
const describeInterests = (list: string[]): string => {
  if (!list || list.length === 0) return "all the things you enjoy";
  if (list.length === 1) return `your love for ${list[0].replace(/_/g, " ")}`;
  const items = list.map((i) => i.replace(/_/g, " "));
  const last = items.pop();
  return `${items.join(", ")} and ${last}`;
};

/**
 * Rephrase/clean user-provided text to avoid verbatim regurgitation
 * Truncates long text and normalizes punctuation
 */
const rephrase = (text: string | null): string | null => {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").replace(/[:;]+/g, ",").trim();
  return cleaned.length > 80 ? cleaned.slice(0, 80).trimEnd() + "…" : cleaned;
};

/**
 * Generate Santa video script based on child info
 * Slow, warm cadence with short sentences for gentle pacing
 * Wishlist woven naturally into conversation - no verbatim repetition
 */
const generateSantaScript = (data: {
  childName: string;
  childAge: number;
  interests: string[];
  excitedGift: string | null;
  specialMessage: string | null;
}): string => {
  // Conversational interests sentence
  const interestsSentence = `I hear about ${describeInterests(data.interests)}. That sounds exciting!`;

  // Wishlist sentence with rephrased text (prioritize excitedGift over specialMessage)
  const wish = rephrase(data.excitedGift ?? data.specialMessage);
  const wishlistSentence = wish
    ? `I hear you're excited about ${wish}. That sounds lovely. I can't promise anything, but I love hearing what makes you happy.`
    : "Remember, the best gifts come from being kind and sharing joy with others.";

  return `
Ho ho ho! Merry Christmas, ${data.childName}.

This is Santa Claus, calling from the North Pole.
My elves tell me you're a wonderful ${data.childAge}-year-old.

${interestsSentence}

${wishlistSentence}

Keep being kind and helpful, ${data.childName}.
I'm so proud of you.

Ho ho ho! Merry Christmas and Happy Holidays!
  `.trim();
};

/**
 * Generate Santa conversation context for live calls
 * Includes structured child info and explicit guardrails
 * Uses conversational phrasing - no verbatim repetition of parent input
 */
const generateSantaContext = (data: {
  childName: string;
  childAge: number;
  interests: string[];
  excitedGift: string | null;
  specialMessage: string | null;
}): string => {
  // Conversational interests description
  const interestsDescription = describeInterests(data.interests);

  // Rephrased wishlist (prioritize excitedGift over specialMessage)
  const wish = rephrase(data.excitedGift ?? data.specialMessage);
  const wishDescription = wish ?? "not provided";

  return `
Child: ${data.childName}, age ${data.childAge}.
Interests (rephrase naturally): ${interestsDescription}.
Wishlist hint (rephrase, do NOT repeat verbatim): ${wishDescription}.

IMPORTANT - WAIT FOR GREETING:
- When the call starts, WAIT for the child to greet you first (e.g., "Hi Santa", "Hello", etc.)
- Do NOT start speaking immediately - pause for 1-2 seconds to let them settle in
- Once they greet you, respond warmly with "Ho ho ho! Well hello there, ${data.childName}!"
- If they seem shy or don't speak after ~5 seconds, gently say "Ho ho ho! Is that ${data.childName} I see?"

GUIDELINES:
- Be warm, jolly Santa - use "Ho ho ho!" naturally
- Keep language simple (ages 3-12)
- Ask about their interests and Christmas wishes conversationally
- Rephrase interests and wishes naturally - do NOT repeat them verbatim
- Encourage kindness and good behavior
- Call duration: ~3 minutes total

CALL PACING - VERY IMPORTANT:
- The call is approximately 3 minutes long
- After about 2 minutes, start wrapping up naturally - do NOT start new questions or topics
- When wrapping up, say something like: "Well ${data.childName}, Santa has to get back to the workshop soon..."
- End with warm holiday wishes: "Remember to be good, and have a very Merry Christmas! Ho ho ho!"
- Do NOT end the call abruptly mid-conversation - always give a proper goodbye
- If the child asks a new question late in the call, give a brief answer then transition to goodbye

CRITICAL GUARDRAILS:
- Do NOT promise specific gifts or visits
- If they mention wishes, acknowledge warmly but say "I can't promise anything, but I love hearing what makes you happy!"
- Avoid scary topics (naughty list punishments, etc.)
- Keep it positive and magical
- End with warm holiday wishes
  `.trim();
};
