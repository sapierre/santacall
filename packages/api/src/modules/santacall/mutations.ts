import { eq } from "@turbostarter/db";
import {
  santacallOrder,
  santacallVideoJob,
  santacallConversation,
} from "@turbostarter/db/schema";
import { db } from "@turbostarter/db/server";
import { generateId } from "@turbostarter/shared/utils";

import type {
  InsertSantacallOrder,
  UpdateSantacallOrder,
  InsertSantacallVideoJob,
  UpdateSantacallVideoJob,
  InsertSantacallConversation,
  UpdateSantacallConversation,
} from "@turbostarter/db/schema";

// =============================================================================
// ORDER MUTATIONS
// =============================================================================

/**
 * Create a new order
 */
export const createOrder = async (
  data: Omit<InsertSantacallOrder, "id" | "createdAt" | "updatedAt">,
) => {
  const result = await db
    .insert(santacallOrder)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning();

  return result[0];
};

/**
 * Update an order by ID
 */
export const updateOrder = async (
  id: string,
  data: Partial<UpdateSantacallOrder>,
) => {
  const result = await db
    .update(santacallOrder)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(santacallOrder.id, id))
    .returning();

  return result[0] ?? null;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  id: string,
  status: InsertSantacallOrder["status"],
  errorMessage?: string,
) => {
  return updateOrder(id, { status, errorMessage });
};

// =============================================================================
// VIDEO JOB MUTATIONS
// =============================================================================

/**
 * Create a new video job for an order
 */
export const createVideoJob = async (
  data: Omit<InsertSantacallVideoJob, "id" | "createdAt" | "updatedAt">,
) => {
  const result = await db
    .insert(santacallVideoJob)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning();

  return result[0];
};

/**
 * Update a video job by ID
 */
export const updateVideoJob = async (
  id: string,
  data: Partial<UpdateSantacallVideoJob>,
) => {
  const result = await db
    .update(santacallVideoJob)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(santacallVideoJob.id, id))
    .returning();

  return result[0] ?? null;
};

/**
 * Update video job by Tavus video ID
 */
export const updateVideoJobByTavusId = async (
  tavusVideoId: string,
  data: Partial<UpdateSantacallVideoJob>,
) => {
  const result = await db
    .update(santacallVideoJob)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(santacallVideoJob.tavusVideoId, tavusVideoId))
    .returning();

  return result[0] ?? null;
};

// =============================================================================
// CONVERSATION MUTATIONS
// =============================================================================

/**
 * Create a new conversation for an order
 */
export const createConversation = async (
  data: Omit<InsertSantacallConversation, "id" | "createdAt" | "updatedAt">,
) => {
  const result = await db
    .insert(santacallConversation)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning();

  return result[0];
};

/**
 * Update a conversation by ID
 */
export const updateConversation = async (
  id: string,
  data: Partial<UpdateSantacallConversation>,
) => {
  const result = await db
    .update(santacallConversation)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(santacallConversation.id, id))
    .returning();

  return result[0] ?? null;
};

/**
 * Update conversation by Tavus conversation ID
 */
export const updateConversationByTavusId = async (
  tavusConversationId: string,
  data: Partial<UpdateSantacallConversation>,
) => {
  const result = await db
    .update(santacallConversation)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(santacallConversation.tavusConversationId, tavusConversationId))
    .returning();

  return result[0] ?? null;
};

/**
 * Generate a unique delivery token
 */
export const generateDeliveryToken = () => generateId();
