import dayjs from "dayjs";

import {
  and,
  asc,
  between,
  count,
  desc,
  eq,
  getOrderByFromSort,
  ilike,
  inArray,
  or,
} from "@turbostarter/db";
import {
  santacallOrder,
  santacallVideoJob,
  santacallConversation,
} from "@turbostarter/db/schema";
import { db } from "@turbostarter/db/server";

import type {
  GetOrdersInput,
  GetVideoJobsInput,
  GetConversationsInput,
  OrderLookupInput,
} from "../../schema";

// =============================================================================
// PUBLIC QUERIES
// =============================================================================

/**
 * Look up an order by order number and delivery token (public access)
 */
export const getOrderByNumberAndToken = async (input: OrderLookupInput) => {
  const order = await db
    .select({
      orderNumber: santacallOrder.orderNumber,
      orderType: santacallOrder.orderType,
      status: santacallOrder.status,
      childName: santacallOrder.childName,
      deliveryUrl: santacallOrder.deliveryUrl,
      scheduledAt: santacallOrder.scheduledAt,
      timezone: santacallOrder.timezone,
    })
    .from(santacallOrder)
    .where(
      and(
        eq(santacallOrder.orderNumber, input.orderNumber),
        eq(santacallOrder.deliveryToken, input.token),
      ),
    )
    .limit(1);

  return order[0] ?? null;
};

/**
 * Get order by Stripe session ID (for webhook processing)
 */
export const getOrderByStripeSessionId = async (sessionId: string) => {
  const order = await db
    .select()
    .from(santacallOrder)
    .where(eq(santacallOrder.stripeSessionId, sessionId))
    .limit(1);

  return order[0] ?? null;
};

/**
 * Get order by Stripe payment intent ID (for idempotency)
 */
export const getOrderByPaymentIntentId = async (paymentIntentId: string) => {
  const order = await db
    .select()
    .from(santacallOrder)
    .where(eq(santacallOrder.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  return order[0] ?? null;
};

// =============================================================================
// ADMIN QUERIES
// =============================================================================

/**
 * Get orders count (for dashboard stats)
 */
export const getOrdersCount = async () =>
  db
    .select({ count: count() })
    .from(santacallOrder)
    .then((res) => res[0]?.count ?? 0);

/**
 * Get orders list with filtering and pagination
 */
export const getOrders = async (input: GetOrdersInput) => {
  const offset = (input.page - 1) * input.perPage;

  const where = and(
    input.q
      ? or(
          ilike(santacallOrder.customerEmail, `%${input.q}%`),
          ilike(santacallOrder.customerName, `%${input.q}%`),
          ilike(santacallOrder.orderNumber, `%${input.q}%`),
          ilike(santacallOrder.childName, `%${input.q}%`),
        )
      : undefined,
    input.orderType
      ? inArray(santacallOrder.orderType, input.orderType)
      : undefined,
    input.status ? inArray(santacallOrder.status, input.status) : undefined,
    input.createdAt
      ? between(
          santacallOrder.createdAt,
          dayjs(input.createdAt[0]).startOf("day").toDate(),
          dayjs(input.createdAt[1]).endOf("day").toDate(),
        )
      : undefined,
    input.scheduledAt
      ? between(
          santacallOrder.scheduledAt,
          dayjs(input.scheduledAt[0]).startOf("day").toDate(),
          dayjs(input.scheduledAt[1]).endOf("day").toDate(),
        )
      : undefined,
  );

  const orderBy = input.sort
    ? getOrderByFromSort({ sort: input.sort, defaultSchema: santacallOrder })
    : [desc(santacallOrder.createdAt)];

  return db.transaction(async (tx) => {
    const data = await db
      .select({
        id: santacallOrder.id,
        orderNumber: santacallOrder.orderNumber,
        orderType: santacallOrder.orderType,
        status: santacallOrder.status,
        customerEmail: santacallOrder.customerEmail,
        customerName: santacallOrder.customerName,
        childName: santacallOrder.childName,
        childAge: santacallOrder.childAge,
        amountPaid: santacallOrder.amountPaid,
        currency: santacallOrder.currency,
        scheduledAt: santacallOrder.scheduledAt,
        timezone: santacallOrder.timezone,
        deliveryUrl: santacallOrder.deliveryUrl,
        deliveryToken: santacallOrder.deliveryToken,
        errorMessage: santacallOrder.errorMessage,
        createdAt: santacallOrder.createdAt,
        updatedAt: santacallOrder.updatedAt,
      })
      .from(santacallOrder)
      .where(where)
      .limit(input.perPage)
      .offset(offset)
      .orderBy(...orderBy);

    const total = await tx
      .select({ count: count() })
      .from(santacallOrder)
      .where(where)
      .execute()
      .then((res) => res[0]?.count ?? 0);

    return { data, total };
  });
};

/**
 * Get single order with related video job and conversation
 */
export const getOrderById = async (id: string) => {
  const order = await db
    .select()
    .from(santacallOrder)
    .where(eq(santacallOrder.id, id))
    .limit(1);

  if (!order[0]) return null;

  // Get related video job if exists
  const videoJob = await db
    .select()
    .from(santacallVideoJob)
    .where(eq(santacallVideoJob.orderId, id))
    .limit(1);

  // Get related conversation if exists
  const conversation = await db
    .select()
    .from(santacallConversation)
    .where(eq(santacallConversation.orderId, id))
    .limit(1);

  return {
    ...order[0],
    videoJob: videoJob[0] ?? null,
    conversation: conversation[0] ?? null,
  };
};

/**
 * Get video jobs list with filtering and pagination
 */
export const getVideoJobs = async (input: GetVideoJobsInput) => {
  const offset = (input.page - 1) * input.perPage;

  const where = and(
    input.status ? inArray(santacallVideoJob.status, input.status) : undefined,
    input.createdAt
      ? between(
          santacallVideoJob.createdAt,
          dayjs(input.createdAt[0]).startOf("day").toDate(),
          dayjs(input.createdAt[1]).endOf("day").toDate(),
        )
      : undefined,
  );

  const orderBy = input.sort
    ? getOrderByFromSort({ sort: input.sort, defaultSchema: santacallVideoJob })
    : [desc(santacallVideoJob.createdAt)];

  return db.transaction(async (tx) => {
    const data = await db
      .select({
        id: santacallVideoJob.id,
        orderId: santacallVideoJob.orderId,
        tavusVideoId: santacallVideoJob.tavusVideoId,
        status: santacallVideoJob.status,
        videoUrl: santacallVideoJob.videoUrl,
        thumbnailUrl: santacallVideoJob.thumbnailUrl,
        errorMessage: santacallVideoJob.errorMessage,
        retryCount: santacallVideoJob.retryCount,
        createdAt: santacallVideoJob.createdAt,
        updatedAt: santacallVideoJob.updatedAt,
        completedAt: santacallVideoJob.completedAt,
        order: {
          orderNumber: santacallOrder.orderNumber,
          customerEmail: santacallOrder.customerEmail,
          childName: santacallOrder.childName,
        },
      })
      .from(santacallVideoJob)
      .leftJoin(
        santacallOrder,
        eq(santacallVideoJob.orderId, santacallOrder.id),
      )
      .where(where)
      .limit(input.perPage)
      .offset(offset)
      .orderBy(...orderBy);

    const total = await tx
      .select({ count: count() })
      .from(santacallVideoJob)
      .where(where)
      .execute()
      .then((res) => res[0]?.count ?? 0);

    return { data, total };
  });
};

/**
 * Get video job by Tavus video ID
 */
export const getVideoJobByTavusId = async (tavusVideoId: string) => {
  const job = await db
    .select()
    .from(santacallVideoJob)
    .where(eq(santacallVideoJob.tavusVideoId, tavusVideoId))
    .limit(1);

  return job[0] ?? null;
};

/**
 * Get conversations list with filtering and pagination
 */
export const getConversations = async (input: GetConversationsInput) => {
  const offset = (input.page - 1) * input.perPage;

  const where = and(
    input.status
      ? inArray(santacallConversation.status, input.status)
      : undefined,
    input.scheduledAt
      ? between(
          santacallConversation.scheduledAt,
          dayjs(input.scheduledAt[0]).startOf("day").toDate(),
          dayjs(input.scheduledAt[1]).endOf("day").toDate(),
        )
      : undefined,
  );

  const orderBy = input.sort
    ? getOrderByFromSort({
        sort: input.sort,
        defaultSchema: santacallConversation,
      })
    : [asc(santacallConversation.scheduledAt)];

  return db.transaction(async (tx) => {
    const data = await db
      .select({
        id: santacallConversation.id,
        orderId: santacallConversation.orderId,
        tavusConversationId: santacallConversation.tavusConversationId,
        status: santacallConversation.status,
        roomUrl: santacallConversation.roomUrl,
        scheduledAt: santacallConversation.scheduledAt,
        startedAt: santacallConversation.startedAt,
        endedAt: santacallConversation.endedAt,
        durationSeconds: santacallConversation.durationSeconds,
        errorMessage: santacallConversation.errorMessage,
        createdAt: santacallConversation.createdAt,
        updatedAt: santacallConversation.updatedAt,
        order: {
          orderNumber: santacallOrder.orderNumber,
          customerEmail: santacallOrder.customerEmail,
          childName: santacallOrder.childName,
          timezone: santacallOrder.timezone,
        },
      })
      .from(santacallConversation)
      .leftJoin(
        santacallOrder,
        eq(santacallConversation.orderId, santacallOrder.id),
      )
      .where(where)
      .limit(input.perPage)
      .offset(offset)
      .orderBy(...orderBy);

    const total = await tx
      .select({ count: count() })
      .from(santacallConversation)
      .where(where)
      .execute()
      .then((res) => res[0]?.count ?? 0);

    return { data, total };
  });
};

/**
 * Get conversation by Tavus conversation ID
 */
export const getConversationByTavusId = async (tavusConversationId: string) => {
  const conversation = await db
    .select()
    .from(santacallConversation)
    .where(eq(santacallConversation.tavusConversationId, tavusConversationId))
    .limit(1);

  return conversation[0] ?? null;
};
