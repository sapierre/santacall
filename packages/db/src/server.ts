import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "./env";
import * as schema from "./schema";

// Disable prepared statements for Supabase pooler compatibility (transaction mode)
const client = postgres(env.DATABASE_URL, { prepare: false });
export const db = drizzle({ client, schema, casing: "snake_case" });
