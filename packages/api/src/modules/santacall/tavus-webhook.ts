import { EmailTemplate } from "@turbostarter/email";
import { sendEmail } from "@turbostarter/email/server";
import { HttpStatusCode } from "@turbostarter/shared/constants";
import { HttpException } from "@turbostarter/shared/utils";

import { env } from "./env";
import {
  updateVideoJobByTavusId,
  updateConversationByTavusId,
  updateOrder,
} from "./mutations";
import {
  getVideoJobByTavusId,
  getConversationByTavusId,
  getOrderById,
} from "./queries";

import type {
  TavusVideoWebhookPayload,
  TavusConversationWebhookPayload,
} from "../../schema";

/**
 * Handle Tavus webhook for video and conversation status updates
 * Expects secret in query param: ?secret=xxx
 */
export const handleTavusWebhook = async (req: Request) => {
  // Verify webhook secret from query params
  // Tavus doesn't sign webhooks, so we use a shared secret in the callback URL
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (!secret || secret !== env.TAVUS_WEBHOOK_SECRET) {
    console.error("Tavus webhook unauthorized - invalid or missing secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: HttpStatusCode.UNAUTHORIZED,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await req.json()) as Record<string, unknown>;

  console.log("Received Tavus webhook:", JSON.stringify(body, null, 2));

  // Determine if this is a video or conversation webhook
  if ("video_id" in body) {
    await handleVideoWebhook(body as unknown as TavusVideoWebhookPayload);
  } else if ("conversation_id" in body) {
    await handleConversationWebhook(
      body as unknown as TavusConversationWebhookPayload,
    );
  } else {
    console.warn("Unknown Tavus webhook payload:", body);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * Handle video generation status updates
 */
const handleVideoWebhook = async (payload: TavusVideoWebhookPayload) => {
  const { video_id, status, download_url, video_url, thumbnail_url, error } =
    payload;

  // Prefer download_url (actual MP4 file) over video_url
  const videoFileUrl = download_url ?? video_url;

  console.log(`Video webhook: ${video_id} - ${status}, url: ${videoFileUrl}`);

  // Get the video job
  const videoJob = await getVideoJobByTavusId(video_id);
  if (!videoJob) {
    console.error(`Video job not found for Tavus video ID: ${video_id}`);
    return;
  }

  // Map Tavus status to our status
  const statusMap: Record<
    string,
    "queued" | "processing" | "completed" | "failed"
  > = {
    queued: "queued",
    generating: "processing",
    ready: "completed",
    failed: "failed",
  };

  const newStatus = statusMap[status] ?? "processing";

  // Update video job
  await updateVideoJobByTavusId(video_id, {
    status: newStatus,
    videoUrl: videoFileUrl ?? null,
    thumbnailUrl: thumbnail_url ?? null,
    errorMessage: error ?? null,
    completedAt: newStatus === "completed" ? new Date() : null,
  });

  // Update parent order
  const order = await getOrderById(videoJob.orderId);
  if (order) {
    if (newStatus === "completed" && videoFileUrl) {
      await updateOrder(videoJob.orderId, {
        status: "ready",
        deliveryUrl: videoFileUrl,
      });
      console.log(`Order ${order.orderNumber} video ready: ${videoFileUrl}`);

      // Send email notification to customer
      try {
        const viewUrl = `${env.NEXT_PUBLIC_APP_URL}/order/${order.orderNumber}?token=${order.deliveryToken}`;
        await sendEmail({
          to: order.customerEmail,
          template: EmailTemplate.SANTACALL_VIDEO_READY,
          variables: {
            customerName: order.customerName,
            childName: order.childName,
            viewUrl,
          },
        });
        console.log(`Video ready email sent to ${order.customerEmail}`);
      } catch (emailError) {
        console.error(`Failed to send video ready email:`, emailError);
        // Don't fail the webhook - email is non-critical
      }
    } else if (newStatus === "failed") {
      await updateOrder(videoJob.orderId, {
        status: "failed",
        errorMessage: error ?? "Video generation failed",
      });
      console.error(`Order ${order.orderNumber} video failed: ${error}`);
    }
  }
};

/**
 * Handle conversation status updates
 */
const handleConversationWebhook = async (
  payload: TavusConversationWebhookPayload,
) => {
  const { conversation_id, status, started_at, ended_at, duration_seconds } =
    payload;

  console.log(`Conversation webhook: ${conversation_id} - ${status}`);

  // Get the conversation
  const conversation = await getConversationByTavusId(conversation_id);
  if (!conversation) {
    console.error(
      `Conversation not found for Tavus conversation ID: ${conversation_id}`,
    );
    return;
  }

  // Map Tavus status to our status
  const statusMap: Record<
    string,
    "scheduled" | "active" | "completed" | "missed" | "cancelled"
  > = {
    active: "active",
    ended: "completed",
  };

  const newStatus = statusMap[status] ?? "scheduled";

  // Update conversation
  await updateConversationByTavusId(conversation_id, {
    status: newStatus,
    startedAt: started_at ? new Date(started_at) : null,
    endedAt: ended_at ? new Date(ended_at) : null,
    durationSeconds: duration_seconds ?? null,
  });

  // Update parent order status
  const order = await getOrderById(conversation.orderId);
  if (order) {
    if (newStatus === "completed") {
      await updateOrder(conversation.orderId, {
        status: "delivered",
      });
      console.log(
        `Order ${order.orderNumber} call completed, duration: ${duration_seconds}s`,
      );

      // Send call completed email to customer
      try {
        const durationMinutes = duration_seconds
          ? Math.ceil(duration_seconds / 60)
          : 5;
        await sendEmail({
          to: order.customerEmail,
          template: EmailTemplate.SANTACALL_CALL_COMPLETED,
          variables: {
            customerName: order.customerName,
            childName: order.childName,
            orderNumber: order.orderNumber,
            durationMinutes,
          },
        });
        console.log(`Call completed email sent to ${order.customerEmail}`);
      } catch (emailError) {
        console.error(`Failed to send call completed email:`, emailError);
        // Don't fail the webhook - email is non-critical
      }
    } else if (newStatus === "active") {
      // Call is in progress, no order status change needed
      console.log(`Order ${order.orderNumber} call started`);
    }
  }
};
