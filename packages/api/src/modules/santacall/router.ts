import { Hono } from "hono";

import { enforceAuth, enforceAdmin, validate } from "../../middleware";
import {
  createBookingSchema,
  orderLookupSchema,
  getOrdersInputSchema,
  getVideoJobsInputSchema,
  getConversationsInputSchema,
} from "../../schema";

import { createCheckoutSession, handleStripeWebhook } from "./checkout";
import {
  getOrderByNumberAndToken,
  getOrders,
  getOrderById,
  getVideoJobs,
  getConversations,
} from "./queries";
import { handleTavusWebhook } from "./tavus-webhook";

// =============================================================================
// PUBLIC ROUTES (No Auth Required)
// =============================================================================

const publicRouter = new Hono()
  // Create checkout session for booking
  .post("/checkout", validate("json", createBookingSchema), async (c) => {
    const input = c.req.valid("json");
    const result = await createCheckoutSession(input);
    return c.json(result);
  })
  // Look up order by number and token (for delivery page)
  .get("/order", validate("query", orderLookupSchema), async (c) => {
    const input = c.req.valid("query");
    const order = await getOrderByNumberAndToken(input);
    return c.json(order);
  });

// =============================================================================
// WEBHOOK ROUTES (No Auth, Signature Verified)
// =============================================================================

const webhookRouter = new Hono()
  // Stripe webhook handler
  .post("/stripe", (c) => handleStripeWebhook(c.req.raw))
  // Tavus webhook handler
  .post("/tavus", (c) => handleTavusWebhook(c.req.raw));

// =============================================================================
// ADMIN ROUTES (Requires enforceAuth + enforceAdmin)
// =============================================================================

const adminRouter = new Hono()
  // List all orders with filtering
  .get("/orders", validate("query", getOrdersInputSchema), async (c) => {
    const input = c.req.valid("query");
    const result = await getOrders(input);
    return c.json(result);
  })
  // Get single order detail
  .get("/orders/:id", async (c) => {
    const id = c.req.param("id");
    const order = await getOrderById(id);
    return c.json(order);
  })
  // List all video jobs
  .get("/video-jobs", validate("query", getVideoJobsInputSchema), async (c) => {
    const input = c.req.valid("query");
    const result = await getVideoJobs(input);
    return c.json(result);
  })
  // List all conversations
  .get(
    "/conversations",
    validate("query", getConversationsInputSchema),
    async (c) => {
      const input = c.req.valid("query");
      const result = await getConversations(input);
      return c.json(result);
    },
  );

// =============================================================================
// COMBINED ROUTER
// =============================================================================

export const santacallRouter = new Hono()
  // Public routes (no auth)
  .route("/", publicRouter)
  // Webhook routes (no auth, signature verified internally)
  .route("/webhook", webhookRouter)
  // Admin routes (auth required)
  .use("/admin/*", enforceAuth, enforceAdmin)
  .route("/admin", adminRouter);
