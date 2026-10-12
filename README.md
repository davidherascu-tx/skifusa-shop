# S.K.I.F.-USA Shop

Next.js 16 (App Router) + [Neon](https://neon.tech) Postgres (Drizzle ORM) + [Better Auth](https://better-auth.com), deployed to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).

## 1. Database and accounts (Neon)

1. Create a project at console.neon.tech. Under **Connect** copy the *pooled* string (host contains `-pooler`) and the *direct* string (pooling off).
2. Put them in `.env.local` (see `.env.example`): `DATABASE_URL` (pooled, used by the app), `DATABASE_URL_DIRECT` (direct, used by migrations and scripts) and `BETTER_AUTH_SECRET` (any long random text).
3. Create the tables and load the catalog:

```bash
npm run db:migrate   # applies drizzle/*.sql to Neon
npm run db:seed      # categories, products and the first seminar (safe to re-run)
```

The schema lives in `lib/db/schema.ts`. After changing it run `npm run db:generate` (writes a new SQL file to `drizzle/`) and then `npm run db:migrate`.
There is no row-level security: every query that returns private data filters by the signed-in user in code, and every admin page and server action starts with `requireAdmin()` (`lib/admin.ts`).
Product images are plain files in `public/`; `products.image_url` holds a path such as `/skif_patch.webp`.

### Admin area

Open **/admin** (or *My account > Admin dashboard*). It manages orders (status, items, ship-to address), S.K.I.F. member requests (approve / reject / remove access) and stock, prices and visibility.
Create your admin account (no email confirmation needed) with:

```bash
npm run create-admin -- you@example.com "YourPassword" "Your Name"
```

Run it again with the same email to reset that admin's password. Customers sign up on the site and must confirm their email once Resend is configured (until then, sign-up logs in immediately).

### Approving S.K.I.F. members

Anyone can create a normal shop account. To order members-only items, a customer opens **My account** and sends a *Request member access* (member number, dojo, note).
Approve or reject requests in **Admin > Members**. Approving sets `profiles.is_member` for that customer; changing an approved request back removes access.

## Email (Resend)

The shop sends its own emails through [Resend](https://resend.com): order received, payment received, shipped / cancelled / refunded, cancellation request received, member access approved or rejected, and alerts to you for new orders, paid orders, cancel requests and member requests.
It sends nothing until these are set in `.env.local` (and as Cloudflare secrets): `RESEND_API_KEY`, `EMAIL_FROM`, optionally `EMAIL_REPLY_TO` and `ADMIN_NOTIFY_EMAIL`.
`EMAIL_FROM` must use a domain you verified in Resend (add the DNS records in Cloudflare). For a first test, `EMAIL_FROM="S.K.I.F.-USA Shop <onboarding@resend.dev>"` works, but Resend then only delivers to the email address of your own Resend account.
Templates live in `lib/email-templates.ts`; the sending rules are in `lib/notify.ts`.

## Live online events (Zoom seminars)

Virtual products are created by `npm run db:seed` (first seminar) and managed in **Admin > Events**.
**Admin > Events** creates and edits events (date/time are typed in Central time and shown to customers in Eastern, Central, Mountain, Pacific and Hawaii time), shows who registered, stores the private Zoom link, and has an **Email Zoom details to attendees** button.
Customers need no shipping address for an online-only order, get one seat per order, and see the Zoom link in **My account** from 12 hours before the start (only after paying). Registration closes when the event starts. Seats are the product's stock; a cancelled or refunded paid order gives the seat back.

## Contact form

`/contact` has a form (name, email, topic, optional order number, message). Messages are saved, emailed to `ADMIN_NOTIFY_EMAIL` with the visitor as Reply-To, and listed in **Admin > Messages**.
Spam protection: hidden honeypot field, signed timing token (rejects instant posts and forged forms), limits per IP / email / hour, max 2 links, server-side validation, HTML-escaped emails, no auto-reply to visitors (so it cannot be abused to email strangers), and optional Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`).

## 2. Payments

Not included yet. Orders are saved as `pending`; customers see them under My Account. Payment (Stripe or PayPal) will be added later.

## 3. Develop

```bash
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
npm run preview              # runs the real Cloudflare Workers build locally (needs .dev.vars)
```

## 4. Deploy to Cloudflare

```bash
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put BETTER_AUTH_SECRET
npm run deploy
```

`NEXT_PUBLIC_*` values are inlined at build time, so also set `NEXT_PUBLIC_SITE_URL` in the build environment (`.env.production` locally, or Workers Builds variables). Then add the custom domain `skifusa-shop.com` in Cloudflare Workers > Settings > Domains.

## Layout

- `app/` pages: home, products (+category filter), product detail, cart, login/signup, account, static pages
- `app/api/checkout` (login required) validates the cart against DB prices/stock and saves a `pending` order with the shipping address
- `proxy.ts` redirects visitors without a session cookie away from `/account` and `/admin`
- `lib/auth.ts` Better Auth config, `lib/session.ts` current user, `lib/db/` Neon + Drizzle (schema in `lib/db/schema.ts`)
- `drizzle/` generated SQL migrations, `db/seed.sql` catalog seed

## Not built yet

Payments, News section, members-only Zoom area, contact form, shipping-rate rules, transactional emails, the real legal/about text.
