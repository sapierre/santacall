import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

import { createIdGenerator, generateId } from "@turbostarter/shared/utils";

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "../lib/zod";

import type * as z from "zod";

// Order types - using const arrays per AGENTS.md (prefer maps over enums)
export const ORDER_TYPES = ["video", "call"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

// Order statuses
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "ready",
  "delivered",
  "failed",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Video job statuses
export const VIDEO_JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;
export type VideoJobStatus = (typeof VIDEO_JOB_STATUSES)[number];

// Conversation statuses
export const CONVERSATION_STATUSES = [
  "scheduled",
  "active",
  "completed",
  "missed",
  "cancelled",
] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

// pgEnums for database
export const orderTypeEnum = pgEnum("santacall_order_type", ORDER_TYPES);
export const orderStatusEnum = pgEnum("santacall_order_status", ORDER_STATUSES);
export const videoJobStatusEnum = pgEnum(
  "santacall_video_job_status",
  VIDEO_JOB_STATUSES,
);
export const conversationStatusEnum = pgEnum(
  "santacall_conversation_status",
  CONVERSATION_STATUSES,
);

// Order number generator: SC-XXXXXXXX (8 uppercase alphanumeric chars)
const generateOrderNumber = createIdGenerator({
  prefix: "SC",
  size: 8,
  alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
});

/**
 * Orders table - stores all SantaCall orders (videos and calls)
 */
export const santacallOrder = pgTable(
  "santacall_order",
  {
    id: text().primaryKey().$defaultFn(generateId),
    orderNumber: text().notNull().unique().$defaultFn(generateOrderNumber),
    orderType: orderTypeEnum().notNull(),
    status: orderStatusEnum().notNull().default("pending"),

    // Customer info (no auth - public checkout)
    customerEmail: text().notNull(),
    customerName: text().notNull(),

    // Child personalization
    childName: text().notNull(),
    childAge: integer().notNull(),
    interests: text(), // JSON string array of interests
    excitedGift: text(), // Main gift/wish the child is most excited about (optional, short)
    specialMessage: text(), // Additional context for Santa

    // Scheduling (for calls)
    scheduledAt: timestamp({ withTimezone: true }), // Stored as UTC
    timezone: text(), // IANA timezone string (e.g., "America/New_York")

    // Payment info (nullable until webhook confirms)
    stripeSessionId: text(),
    stripePaymentIntentId: text().unique(), // Used for idempotency
    amountPaid: integer(), // Amount in cents
    currency: text(), // ISO currency code (e.g., "usd")

    // Delivery
    deliveryUrl: text(), // Video URL or call room URL
    deliveryToken: text(), // Access token for viewing

    // Error tracking
    errorMessage: text(),

    // Timestamps
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("santacall_order_email_idx").on(table.customerEmail),
    index("santacall_order_status_idx").on(table.status),
    index("santacall_order_type_idx").on(table.orderType),
    index("santacall_order_scheduled_idx").on(table.scheduledAt),
    index("santacall_order_stripe_session_idx").on(table.stripeSessionId),
    index("santacall_order_payment_intent_idx").on(table.stripePaymentIntentId),
  ],
);

/**
 * Video jobs table - tracks Tavus video generation
 */
export const santacallVideoJob = pgTable(
  "santacall_video_job",
  {
    id: text().primaryKey().$defaultFn(generateId),
    orderId: text()
      .notNull()
      .references(() => santacallOrder.id, { onDelete: "cascade" }),

    // Tavus API
    tavusVideoId: text().unique(), // video_id from Tavus
    status: videoJobStatusEnum().notNull().default("queued"),

    // Result
    videoUrl: text(), // Final video URL from Tavus
    thumbnailUrl: text(),

    // Error tracking
    errorMessage: text(),
    retryCount: integer().notNull().default(0),

    // Timestamps
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .$onUpdate(() => new Date()),
    completedAt: timestamp(),
  },
  (table) => [
    index("santacall_video_job_order_idx").on(table.orderId),
    index("santacall_video_job_status_idx").on(table.status),
    index("santacall_video_job_tavus_idx").on(table.tavusVideoId),
  ],
);

/**
 * Conversations table - tracks Tavus live conversations (Santa calls)
 */
export const santacallConversation = pgTable(
  "santacall_conversation",
  {
    id: text().primaryKey().$defaultFn(generateId),
    orderId: text()
      .notNull()
      .references(() => santacallOrder.id, { onDelete: "cascade" }),

    // Tavus API
    tavusConversationId: text().unique(), // conversation_id from Tavus
    status: conversationStatusEnum().notNull().default("scheduled"),

    // Call details
    roomUrl: text(), // Daily.co room URL
    scheduledAt: timestamp({ withTimezone: true }).notNull(),
    startedAt: timestamp({ withTimezone: true }),
    endedAt: timestamp({ withTimezone: true }),
    durationSeconds: integer(), // Actual call duration

    // Error tracking
    errorMessage: text(),

    // Timestamps
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("santacall_conversation_order_idx").on(table.orderId),
    index("santacall_conversation_status_idx").on(table.status),
    index("santacall_conversation_scheduled_idx").on(table.scheduledAt),
    index("santacall_conversation_tavus_idx").on(table.tavusConversationId),
  ],
);

// Relations
export const santacallOrderRelations = relations(santacallOrder, ({ one }) => ({
  videoJob: one(santacallVideoJob, {
    fields: [santacallOrder.id],
    references: [santacallVideoJob.orderId],
  }),
  conversation: one(santacallConversation, {
    fields: [santacallOrder.id],
    references: [santacallConversation.orderId],
  }),
}));

export const santacallVideoJobRelations = relations(
  santacallVideoJob,
  ({ one }) => ({
    order: one(santacallOrder, {
      fields: [santacallVideoJob.orderId],
      references: [santacallOrder.id],
    }),
  }),
);

export const santacallConversationRelations = relations(
  santacallConversation,
  ({ one }) => ({
    order: one(santacallOrder, {
      fields: [santacallConversation.orderId],
      references: [santacallOrder.id],
    }),
  }),
);

// Zod schemas for validation
export const insertSantacallOrderSchema = createInsertSchema(santacallOrder);
export const selectSantacallOrderSchema = createSelectSchema(santacallOrder);
export const updateSantacallOrderSchema = createUpdateSchema(santacallOrder);

export const insertSantacallVideoJobSchema =
  createInsertSchema(santacallVideoJob);
export const selectSantacallVideoJobSchema =
  createSelectSchema(santacallVideoJob);
export const updateSantacallVideoJobSchema =
  createUpdateSchema(santacallVideoJob);

export const insertSantacallConversationSchema = createInsertSchema(
  santacallConversation,
);
export const selectSantacallConversationSchema = createSelectSchema(
  santacallConversation,
);
export const updateSantacallConversationSchema = createUpdateSchema(
  santacallConversation,
);

// TypeScript types
export type InsertSantacallOrder = z.infer<typeof insertSantacallOrderSchema>;
export type SelectSantacallOrder = z.infer<typeof selectSantacallOrderSchema>;
export type UpdateSantacallOrder = z.infer<typeof updateSantacallOrderSchema>;

export type InsertSantacallVideoJob = z.infer<
  typeof insertSantacallVideoJobSchema
>;
export type SelectSantacallVideoJob = z.infer<
  typeof selectSantacallVideoJobSchema
>;
export type UpdateSantacallVideoJob = z.infer<
  typeof updateSantacallVideoJobSchema
>;

export type InsertSantacallConversation = z.infer<
  typeof insertSantacallConversationSchema
>;
export type SelectSantacallConversation = z.infer<
  typeof selectSantacallConversationSchema
>;
export type UpdateSantacallConversation = z.infer<
  typeof updateSantacallConversationSchema
>;
