import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export * from "./schema";

/**
 * Neon over HTTP (fetch): works on Cloudflare Workers and in `next dev` with no WebSocket setup.
 * A new client per call is cheap; there is no connection to keep open. Server-only.
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}

export type Db = ReturnType<typeof getDb>;
