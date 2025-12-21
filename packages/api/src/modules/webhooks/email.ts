import { Webhook } from "svix";

import { eq, desc } from "@turbostarter/db";
import { santacallContact } from "@turbostarter/db/schema";
import { db } from "@turbostarter/db/server";

import type { Context } from "hono";

// Resend webhook payload types
interface ResendEmailReceivedEvent {
  type: "email.received";
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    message_id: string;
    attachments: {
      id: string;
      filename: string;
      content_type: string;
    }[];
  };
}

// Resend received email response
interface ResendReceivedEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  created_at: string;
}

/**
 * Extract email address from "Name <email@example.com>" format
 */
function extractEmail(fromString: string): string {
  const match = /<([^>]+)>/.exec(fromString);
  return match?.[1] ?? fromString;
}

/**
 * Fetch full email content from Resend API
 */
async function fetchEmailContent(
  emailId: string,
): Promise<ResendReceivedEmail | null> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch email content:", await response.text());
      return null;
    }

    return (await response.json()) as ResendReceivedEmail;
  } catch (error) {
    console.error("Error fetching email content:", error);
    return null;
  }
}

/**
 * Verify Resend webhook signature using svix
 */
function verifyWebhookSignature(
  payload: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("RESEND_WEBHOOK_SECRET not configured, skipping verification");
    return true; // Allow in development without secret
  }

  if (!headers.id || !headers.timestamp || !headers.signature) {
    console.error("Missing svix headers");
    return false;
  }

  try {
    const wh = new Webhook(secret);

    wh.verify(payload, {
      "svix-id": headers.id,
      "svix-timestamp": headers.timestamp,
      "svix-signature": headers.signature,
    });

    return true;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return false;
  }
}

/**
 * Handle incoming email webhook from Resend
 */
export async function handleEmailWebhook(c: Context): Promise<Response> {
  try {
    const payload = await c.req.text();

    // Verify signature
    const isValid = verifyWebhookSignature(payload, {
      id: c.req.header("svix-id") ?? null,
      timestamp: c.req.header("svix-timestamp") ?? null,
      signature: c.req.header("svix-signature") ?? null,
    });

    if (!isValid) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    const event = JSON.parse(payload) as ResendEmailReceivedEvent;

    // Only handle email.received events
    if (event.type !== "email.received") {
      return c.json({ message: "Event type not handled" }, 200);
    }

    const { data } = event;
    const fromEmail = extractEmail(data.from);

    console.log(`Received email from ${fromEmail}, subject: ${data.subject}`);

    // Fetch full email content
    const emailContent = await fetchEmailContent(data.email_id);

    if (!emailContent) {
      console.error("Could not fetch email content");
      return c.json({ error: "Could not fetch email content" }, 500);
    }

    // Get the email body (prefer text over html)
    const emailBody = emailContent.text || emailContent.html || "";

    // Find the most recent contact from this email address that has been replied to
    const contact = await db.query.santacallContact.findFirst({
      where: (contacts, { eq, and, isNotNull }) =>
        and(eq(contacts.email, fromEmail), isNotNull(contacts.adminReply)),
      orderBy: [desc(santacallContact.repliedAt)],
    });

    if (!contact) {
      console.log(
        `No replied contact found for email ${fromEmail}, skipping...`,
      );
      // Still return 200 to acknowledge receipt
      return c.json({ message: "No matching contact found" }, 200);
    }

    // Update the contact with the user's reply
    await db
      .update(santacallContact)
      .set({
        userReply: emailBody,
        userRepliedAt: new Date(),
        status: "new", // Mark as new so admin sees there's a new reply
      })
      .where(eq(santacallContact.id, contact.id));

    console.log(`Updated contact ${contact.id} with user reply`);

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Error handling email webhook:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}
