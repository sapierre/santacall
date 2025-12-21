import * as z from "zod";

import {
  ORDER_TYPES,
  ORDER_STATUSES,
  VIDEO_JOB_STATUSES,
  CONVERSATION_STATUSES,
} from "@turbostarter/db/schema";
import {
  offsetPaginationSchema,
  sortSchema,
} from "@turbostarter/shared/schema";

// Interests list for child personalization
export const SANTA_INTERESTS = [
  "dinosaurs",
  "unicorns",
  "sports",
  "video_games",
  "animals",
  "space",
  "music",
  "art",
  "reading",
  "legos",
  "dolls",
  "cars",
  "superheroes",
  "princesses",
  "science",
  "cooking",
] as const;

// Call scheduling window (4pm-8pm local time)
export const CALL_WINDOW_START_HOUR = 16; // 4 PM
export const CALL_WINDOW_END_HOUR = 20; // 8 PM
export const MIN_LEAD_TIME_HOURS = 2;
export const MAX_ADVANCE_DAYS = 7;

// =============================================================================
// PUBLIC CHECKOUT SCHEMAS (No Auth Required)
// =============================================================================

/**
 * Child schema - used for multiple children support
 */
const childSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().int().min(1).max(17),
});

/**
 * Base booking input - shared fields for video and call orders
 */
const baseBookingSchema = z.object({
  // Customer info
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(100),

  // Child personalization (supports 1-4 children)
  children: z.array(childSchema).min(1, "At least one child is required").max(4, "Maximum 4 children allowed"),

  // Backwards compatibility - kept for legacy support
  childName: z.string().min(1).max(50).optional(),
  childAge: z.number().int().min(1).max(17).optional(),

  interests: z.array(z.enum(SANTA_INTERESTS)).min(1).max(5).optional(),
  excitedGift: z.string().max(80).optional(), // Main gift/wish (short, conversational)
  specialMessage: z.string().max(500).optional(),
});

/**
 * Video booking - simpler, no scheduling required
 */
export const createVideoBookingSchema = baseBookingSchema.extend({
  orderType: z.literal("video"),
});

export type CreateVideoBookingInput = z.infer<typeof createVideoBookingSchema>;

/**
 * Call booking - requires scheduling with validation
 * Validates:
 * - 2-hour minimum lead time
 * - 7-day maximum advance booking
 * - 4pm-8pm local time window
 * - Valid IANA timezone
 *
 * Note: testMode flag bypasses scheduling validations for testing
 */
export const createCallBookingSchema = baseBookingSchema
  .extend({
    orderType: z.literal("call"),
    scheduledAt: z.coerce.date(),
    timezone: z.string().min(1),
    testMode: z.boolean().optional(), // Skip validation for testing
  })
  .refine(
    (data) => {
      // Validate timezone is a valid IANA timezone
      try {
        Intl.DateTimeFormat(undefined, { timeZone: data.timezone });
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid timezone", path: ["timezone"] },
  )
  .refine(
    (data) => {
      // Skip validation in test mode
      if (data.testMode) return true;
      // 2-hour minimum lead time
      const now = new Date();
      const minLeadMs = MIN_LEAD_TIME_HOURS * 60 * 60 * 1000;
      return data.scheduledAt.getTime() - now.getTime() >= minLeadMs;
    },
    {
      message: `Call must be scheduled at least ${MIN_LEAD_TIME_HOURS} hours in advance`,
      path: ["scheduledAt"],
    },
  )
  .refine(
    (data) => {
      // Skip validation in test mode
      if (data.testMode) return true;
      // 7-day maximum advance booking
      const now = new Date();
      const maxAdvanceMs = MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000;
      return data.scheduledAt.getTime() - now.getTime() <= maxAdvanceMs;
    },
    {
      message: `Call must be scheduled within ${MAX_ADVANCE_DAYS} days`,
      path: ["scheduledAt"],
    },
  )
  .refine(
    (data) => {
      // Skip validation in test mode
      if (data.testMode) return true;
      // 4pm-8pm in customer's timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: data.timezone,
        hour: "numeric",
        hour12: false,
      });
      const hour = parseInt(formatter.format(data.scheduledAt), 10);
      return hour >= CALL_WINDOW_START_HOUR && hour < CALL_WINDOW_END_HOUR;
    },
    {
      message: `Call must be scheduled between ${CALL_WINDOW_START_HOUR % 12 || 12}pm and ${CALL_WINDOW_END_HOUR % 12 || 12}pm in your timezone`,
      path: ["scheduledAt"],
    },
  );

export type CreateCallBookingInput = z.infer<typeof createCallBookingSchema>;

/**
 * Combined booking schema for checkout
 */
export const createBookingSchema = z.discriminatedUnion("orderType", [
  createVideoBookingSchema,
  createCallBookingSchema,
]);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Checkout response schema
 */
export const checkoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
  orderId: z.string(),
  orderNumber: z.string(),
});

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

/**
 * Order lookup by ID or number (for viewing delivery)
 */
export const orderLookupSchema = z.object({
  orderNumber: z.string().min(1),
  token: z.string().min(1), // Delivery token for security
});

export type OrderLookupInput = z.infer<typeof orderLookupSchema>;

/**
 * Public order details response (for delivery page)
 */
export const publicOrderResponseSchema = z.object({
  orderNumber: z.string(),
  orderType: z.enum(ORDER_TYPES),
  status: z.enum(ORDER_STATUSES),
  childName: z.string(),
  deliveryUrl: z.string().nullable(),
  scheduledAt: z.coerce.date().nullable(),
  timezone: z.string().nullable(),
});

export type PublicOrderResponse = z.infer<typeof publicOrderResponseSchema>;

// =============================================================================
// ADMIN SCHEMAS (Requires enforceAuth + enforceAdmin)
// =============================================================================

/**
 * Get orders list with filtering/pagination
 */
export const getOrdersInputSchema = offsetPaginationSchema.extend({
  sort: z
    .string()
    .transform((val) =>
      z.array(sortSchema).parse(JSON.parse(decodeURIComponent(val))),
    )
    .optional(),
  q: z.string().optional(), // Search by email, name, order number
  orderType: z
    .union([
      z.enum(ORDER_TYPES).transform((val) => [val]),
      z.array(z.enum(ORDER_TYPES)),
    ])
    .optional(),
  status: z
    .union([
      z.enum(ORDER_STATUSES).transform((val) => [val]),
      z.array(z.enum(ORDER_STATUSES)),
    ])
    .optional(),
  createdAt: z.tuple([z.coerce.number(), z.coerce.number()]).optional(),
  scheduledAt: z.tuple([z.coerce.number(), z.coerce.number()]).optional(),
});

export type GetOrdersInput = z.infer<typeof getOrdersInputSchema>;

/**
 * Orders list response
 */
export const getOrdersResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      orderNumber: z.string(),
      orderType: z.enum(ORDER_TYPES),
      status: z.enum(ORDER_STATUSES),
      customerEmail: z.string(),
      customerName: z.string(),
      childName: z.string(),
      childAge: z.number(),
      amountPaid: z.number().nullable(),
      currency: z.string().nullable(),
      scheduledAt: z.coerce.date().nullable(),
      timezone: z.string().nullable(),
      deliveryUrl: z.string().nullable(),
      deliveryToken: z.string().nullable(),
      errorMessage: z.string().nullable(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    }),
  ),
  total: z.number(),
});

export type GetOrdersResponse = z.infer<typeof getOrdersResponseSchema>;

/**
 * Single order detail schema (admin view)
 */
export const getOrderDetailResponseSchema = z
  .object({
    id: z.string(),
    orderNumber: z.string(),
    orderType: z.enum(ORDER_TYPES),
    status: z.enum(ORDER_STATUSES),
    customerEmail: z.string(),
    customerName: z.string(),
    childName: z.string(),
    childAge: z.number(),
    interests: z.string().nullable(), // JSON string
    specialMessage: z.string().nullable(),
    scheduledAt: z.coerce.date().nullable(),
    timezone: z.string().nullable(),
    stripeSessionId: z.string().nullable(),
    stripePaymentIntentId: z.string().nullable(),
    amountPaid: z.number().nullable(),
    currency: z.string().nullable(),
    deliveryUrl: z.string().nullable(),
    deliveryToken: z.string().nullable(),
    errorMessage: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    // Related records
    videoJob: z
      .object({
        id: z.string(),
        tavusVideoId: z.string().nullable(),
        status: z.enum(VIDEO_JOB_STATUSES),
        videoUrl: z.string().nullable(),
        thumbnailUrl: z.string().nullable(),
        errorMessage: z.string().nullable(),
        retryCount: z.number(),
        createdAt: z.coerce.date(),
        completedAt: z.coerce.date().nullable(),
      })
      .nullable(),
    conversation: z
      .object({
        id: z.string(),
        tavusConversationId: z.string().nullable(),
        status: z.enum(CONVERSATION_STATUSES),
        roomUrl: z.string().nullable(),
        scheduledAt: z.coerce.date(),
        startedAt: z.coerce.date().nullable(),
        endedAt: z.coerce.date().nullable(),
        durationSeconds: z.number().nullable(),
        errorMessage: z.string().nullable(),
        createdAt: z.coerce.date(),
      })
      .nullable(),
  })
  .nullable();

export type GetOrderDetailResponse = z.infer<
  typeof getOrderDetailResponseSchema
>;

/**
 * Get video jobs list (admin)
 */
export const getVideoJobsInputSchema = offsetPaginationSchema.extend({
  sort: z
    .string()
    .transform((val) =>
      z.array(sortSchema).parse(JSON.parse(decodeURIComponent(val))),
    )
    .optional(),
  status: z
    .union([
      z.enum(VIDEO_JOB_STATUSES).transform((val) => [val]),
      z.array(z.enum(VIDEO_JOB_STATUSES)),
    ])
    .optional(),
  createdAt: z.tuple([z.coerce.number(), z.coerce.number()]).optional(),
});

export type GetVideoJobsInput = z.infer<typeof getVideoJobsInputSchema>;

export const getVideoJobsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      orderId: z.string(),
      tavusVideoId: z.string().nullable(),
      status: z.enum(VIDEO_JOB_STATUSES),
      videoUrl: z.string().nullable(),
      thumbnailUrl: z.string().nullable(),
      errorMessage: z.string().nullable(),
      retryCount: z.number(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
      completedAt: z.coerce.date().nullable(),
      order: z.object({
        orderNumber: z.string(),
        customerEmail: z.string(),
        childName: z.string(),
      }),
    }),
  ),
  total: z.number(),
});

export type GetVideoJobsResponse = z.infer<typeof getVideoJobsResponseSchema>;

/**
 * Get conversations list (admin)
 */
export const getConversationsInputSchema = offsetPaginationSchema.extend({
  sort: z
    .string()
    .transform((val) =>
      z.array(sortSchema).parse(JSON.parse(decodeURIComponent(val))),
    )
    .optional(),
  status: z
    .union([
      z.enum(CONVERSATION_STATUSES).transform((val) => [val]),
      z.array(z.enum(CONVERSATION_STATUSES)),
    ])
    .optional(),
  scheduledAt: z.tuple([z.coerce.number(), z.coerce.number()]).optional(),
});

export type GetConversationsInput = z.infer<typeof getConversationsInputSchema>;

export const getConversationsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      orderId: z.string(),
      tavusConversationId: z.string().nullable(),
      status: z.enum(CONVERSATION_STATUSES),
      roomUrl: z.string().nullable(),
      scheduledAt: z.coerce.date(),
      startedAt: z.coerce.date().nullable(),
      endedAt: z.coerce.date().nullable(),
      durationSeconds: z.number().nullable(),
      errorMessage: z.string().nullable(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
      order: z.object({
        orderNumber: z.string(),
        customerEmail: z.string(),
        childName: z.string(),
        timezone: z.string().nullable(),
      }),
    }),
  ),
  total: z.number(),
});

export type GetConversationsResponse = z.infer<
  typeof getConversationsResponseSchema
>;

// =============================================================================
// WEBHOOK SCHEMAS (Internal use)
// =============================================================================

/**
 * Tavus webhook payload for video status updates
 */
export const tavusVideoWebhookSchema = z.object({
  video_id: z.string(),
  status: z.enum(["queued", "generating", "ready", "failed"]),
  // Tavus sends multiple URL fields - use download_url for the actual MP4 file
  download_url: z.string().url().optional(),
  video_url: z.string().url().optional(), // Fallback
  hosted_url: z.string().url().optional(), // HTML player page (don't use for video src)
  stream_url: z.string().url().optional(), // HLS stream
  thumbnail_url: z.string().url().optional(),
  error: z.string().optional(),
});

export type TavusVideoWebhookPayload = z.infer<typeof tavusVideoWebhookSchema>;

/**
 * Tavus webhook payload for conversation status updates
 */
export const tavusConversationWebhookSchema = z.object({
  conversation_id: z.string(),
  status: z.enum(["active", "ended"]),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
  duration_seconds: z.number().optional(),
});

export type TavusConversationWebhookPayload = z.infer<
  typeof tavusConversationWebhookSchema
>;

// =============================================================================
// CALL SCHEDULING HELPERS
// =============================================================================

/**
 * Available time slots response for a given date
 */
export const getTimeSlotsInputSchema = z.object({
  date: z.coerce.date(),
  timezone: z.string().min(1),
});

export type GetTimeSlotsInput = z.infer<typeof getTimeSlotsInputSchema>;

export const getTimeSlotsResponseSchema = z.object({
  date: z.string(),
  timezone: z.string(),
  slots: z.array(
    z.object({
      time: z.string(), // ISO time string
      available: z.boolean(),
    }),
  ),
});

export type GetTimeSlotsResponse = z.infer<typeof getTimeSlotsResponseSchema>;
