// Loads the shop catalog (categories, products, first seminar) into Neon. Safe to re-run.
// Usage: npm run db:seed   (reads DATABASE_URL_DIRECT / DATABASE_URL from .env.local)
import { readFileSync } from "node:fs";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL_DIRECT / DATABASE_URL in .env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
try {
  await pool.query(readFileSync(new URL("../db/seed.sql", import.meta.url), "utf8"));
  const { rows } = await pool.query("select (select count(*) from public.categories) as categories, (select count(*) from public.products) as products");
  console.log(`Seeded. ${rows[0].categories} categories, ${rows[0].products} products.`);
} finally {
  await pool.end();
}
