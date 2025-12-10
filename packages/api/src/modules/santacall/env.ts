import { defineEnv } from "envin";
import * as z from "zod";

import { envConfig } from "@turbostarter/shared/constants";

import type { Preset } from "envin/types";

export const preset = {
  id: "santacall",
  server: {
    // Stripe keys
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_SANTACALL_WEBHOOK_SECRET: z.string(), // Dedicated webhook secret for SantaCall

    // SantaCall pricing (in cents USD)
    SANTACALL_VIDEO_PRICE_CENTS: z.coerce.number().int().default(1499), // $14.99
    SANTACALL_CALL_PRICE_CENTS: z.coerce.number().int().default(2999), // $29.99

    // App URLs
    NEXT_PUBLIC_APP_URL: z.string().url(),

    // Tavus API
    TAVUS_API_KEY: z.string(),
    TAVUS_REPLICA_ID: z.string(), // Santa replica
    TAVUS_PERSONA_ID: z.string(), // Santa persona for conversations
    TAVUS_WEBHOOK_SECRET: z.string().min(32), // Secret for webhook authentication
  },
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
