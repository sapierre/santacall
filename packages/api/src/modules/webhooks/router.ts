import { Hono } from "hono";

import { handleEmailWebhook } from "./email";

export const webhooksRouter = new Hono().post("/email", (c) =>
  handleEmailWebhook(c),
);
