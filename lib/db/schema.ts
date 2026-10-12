import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Domain columns keep their snake_case names on purpose: rows come back as { price_cents, order_items, ... },
// exactly the shape the pages and emails already use.
const createdAt = () => timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow();
const tstz = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });

// ---------- Better Auth (users, sessions, passwords) ----------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---------- Shop ----------
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    category_id: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    price_cents: integer("price_cents").notNull(),
    sale_price_cents: integer("sale_price_cents"),
    image_url: text("image_url"),
    images: text("images").array().notNull().default(sql`'{}'::text[]`),
    sizes: text("sizes").array().notNull().default(sql`'{}'::text[]`),
    stock: integer("stock").notNull().default(0),
    members_only: boolean("members_only").notNull().default(false),
    active: boolean("active").notNull().default(true),
    kind: text("kind").notNull().default("physical"),
    event_start: tstz("event_start"),
    event_minutes: integer("event_minutes"),
    created_at: createdAt(),
  },
  (t) => [
    index("products_category_id_idx").on(t.category_id),
    check("products_price_cents_check", sql`${t.price_cents} >= 0`),
    check("products_sale_price_cents_check", sql`${t.sale_price_cents} >= 0`),
    check("products_stock_check", sql`${t.stock} >= 0`),
    check("products_kind_check", sql`${t.kind} in ('physical','virtual')`),
    check("products_event_minutes_check", sql`${t.event_minutes} is null or ${t.event_minutes} > 0`),
  ],
);

/** Zoom link / password. Never exposed with the public product; the server reveals it only to paid attendees. */
export const event_access = pgTable("event_access", {
  product_id: uuid("product_id").primaryKey().references(() => products.id, { onDelete: "cascade" }),
  join_url: text("join_url"),
  join_info: text("join_info"),
  details_emailed_at: tstz("details_emailed_at"),
});

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  full_name: text("full_name"),
  is_member: boolean("is_member").notNull().default(false),
  is_admin: boolean("is_admin").notNull().default(false),
  address: jsonb("address"),
  created_at: createdAt(),
});

export const orderStatus = pgEnum("order_status", ["pending", "paid", "shipped", "cancelled", "refunded"]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").references(() => user.id, { onDelete: "set null" }),
  email: text("email"),
  status: orderStatus("status").notNull().default("pending"),
  total_cents: integer("total_cents").notNull().default(0),
  tax_cents: integer("tax_cents").notNull().default(0),
  payment_ref: text("payment_ref").unique(),
  shipping: jsonb("shipping"),
  cancel_requested_at: tstz("cancel_requested_at"),
  cancel_reason: text("cancel_reason"),
  created_at: createdAt(),
});

export const order_items = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    order_id: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    product_id: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    unit_price_cents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    size: text("size"),
  },
  (t) => [check("order_items_quantity_check", sql`${t.quantity} > 0`)],
);

export const member_requests = pgTable(
  "member_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    member_number: text("member_number").notNull(),
    dojo: text("dojo"),
    note: text("note"),
    status: text("status").notNull().default("pending"),
    created_at: createdAt(),
    reviewed_at: tstz("reviewed_at"),
  },
  (t) => [
    // one open request per customer
    uniqueIndex("member_requests_one_pending").on(t.user_id).where(sql`${t.status} = 'pending'`),
    check("member_requests_status_check", sql`${t.status} in ('pending','approved','rejected')`),
  ],
);

export const contact_messages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    created_at: createdAt(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    topic: text("topic"),
    order_number: text("order_number"),
    message: text("message").notNull(),
    user_id: text("user_id").references(() => user.id, { onDelete: "set null" }),
    ip_hash: text("ip_hash"),
    handled: boolean("handled").notNull().default(false),
    reply: text("reply"),
    replied_at: tstz("replied_at"),
  },
  (t) => [
    index("contact_messages_ip_time").on(t.ip_hash, t.created_at),
    index("contact_messages_email_time").on(sql`lower(${t.email})`, t.created_at),
    index("contact_messages_open").on(t.handled, t.created_at.desc()),
  ],
);

// ---------- Relations (for db.query.*.findMany({ with: ... })) ----------
export const categoriesRelations = relations(categories, ({ many }) => ({ products: many(products) }));
export const productsRelations = relations(products, ({ one }) => ({
  categories: one(categories, { fields: [products.category_id], references: [categories.id] }),
}));
export const ordersRelations = relations(orders, ({ many }) => ({ order_items: many(order_items) }));
export const orderItemsRelations = relations(order_items, ({ one }) => ({
  orders: one(orders, { fields: [order_items.order_id], references: [orders.id] }),
  products: one(products, { fields: [order_items.product_id], references: [products.id] }),
}));
export const memberRequestsRelations = relations(member_requests, ({ one }) => ({
  profiles: one(profiles, { fields: [member_requests.user_id], references: [profiles.id] }),
}));
