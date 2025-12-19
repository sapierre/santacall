import * as z from "zod";

import {
  offsetPaginationSchema,
  sortSchema,
} from "@turbostarter/shared/schema";

// Contact statuses - duplicated here to avoid db dependency in web app
export const CONTACT_STATUSES = ["new", "read", "replied", "archived"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const getContactsInputSchema = offsetPaginationSchema.extend({
  sort: z
    .string()
    .transform((val) =>
      z.array(sortSchema).parse(JSON.parse(decodeURIComponent(val))),
    )
    .optional(),
  q: z.string().optional(),
  status: z
    .union([
      z.enum(CONTACT_STATUSES).transform((val) => [val]),
      z.array(z.enum(CONTACT_STATUSES)),
    ])
    .optional(),
  createdAt: z.tuple([z.coerce.number(), z.coerce.number()]).optional(),
});

export type GetContactsInput = z.infer<typeof getContactsInputSchema>;

/**
 * Contact list response schema
 */
export const getContactsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      message: z.string(),
      status: z.enum(CONTACT_STATUSES),
      adminReply: z.string().nullable(),
      repliedAt: z.coerce.date().nullable(),
      repliedBy: z.string().nullable(),
      userReply: z.string().nullable(),
      userRepliedAt: z.coerce.date().nullable(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    }),
  ),
  total: z.number(),
});

export type GetContactsResponse = z.infer<typeof getContactsResponseSchema>;
export type Contact = GetContactsResponse["data"][number];

export const updateContactInputSchema = z.object({
  status: z.enum(CONTACT_STATUSES),
});

export type UpdateContactInput = z.infer<typeof updateContactInputSchema>;

export const replyContactInputSchema = z.object({
  reply: z.string().min(1).max(10000),
});

export type ReplyContactInput = z.infer<typeof replyContactInputSchema>;

export const createContactInputSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  message: z.string().min(10).max(4000),
});

export type CreateContactInput = z.infer<typeof createContactInputSchema>;
