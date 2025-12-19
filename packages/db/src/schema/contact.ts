import { pgTable, pgEnum, text, timestamp, index } from "drizzle-orm/pg-core";

import { generateId } from "@turbostarter/shared/utils";

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "../lib/zod";

import type * as z from "zod";

// Contact statuses
export const CONTACT_STATUSES = ["new", "read", "replied", "archived"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

// pgEnum for database
export const contactStatusEnum = pgEnum(
  "santacall_contact_status",
  CONTACT_STATUSES,
);

/**
 * Contacts table - stores all contact form submissions
 */
export const santacallContact = pgTable(
  "santacall_contact",
  {
    id: text().primaryKey().$defaultFn(generateId),

    // Submitter info
    name: text().notNull(),
    email: text().notNull(),
    message: text().notNull(),

    // Status tracking
    status: contactStatusEnum().notNull().default("new"),

    // Admin reply
    adminReply: text(),
    repliedAt: timestamp({ withTimezone: true }),
    repliedBy: text(), // Admin user ID who replied

    // User reply (when user replies to admin email)
    userReply: text(),
    userRepliedAt: timestamp({ withTimezone: true }),

    // Timestamps
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("santacall_contact_email_idx").on(table.email),
    index("santacall_contact_status_idx").on(table.status),
    index("santacall_contact_created_idx").on(table.createdAt),
  ],
);

// Zod schemas for validation
export const insertSantacallContactSchema =
  createInsertSchema(santacallContact);
export const selectSantacallContactSchema =
  createSelectSchema(santacallContact);
export const updateSantacallContactSchema =
  createUpdateSchema(santacallContact);

// TypeScript types
export type InsertSantacallContact = z.infer<
  typeof insertSantacallContactSchema
>;
export type SelectSantacallContact = z.infer<
  typeof selectSantacallContactSchema
>;
export type UpdateSantacallContact = z.infer<
  typeof updateSantacallContactSchema
>;
