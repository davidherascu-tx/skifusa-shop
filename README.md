# S.K.I.F.-USA Shop

Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage), deployed to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).

## 1. Supabase

1. Create a project at supabase.com.
2. SQL Editor: run `supabase/migrations/0001_init.sql`, `0002_member_requests.sql`, then `supabase/seed.sql` (sample products).
3. Copy URL, anon key and service-role key (Project Settings > API) into `.env.local` (see `.env.example`).
4. Auth > URL Configuration: set Site URL to your domain and add `http://localhost:3000/**` as a redirect URL.
5. Upload product images to the public `products` Storage bucket and paste the public URL into `products.image_url`.
6. Make yourself admin / member: `update profiles set is_admin = true where id = '<your user id>';` (`is_member` gives access to `members_only` products).

### Admin area

Open **/admin** (or *My account > Admin dashboard*). It manages orders (status, items, ship-to address), S.K.I.F. member requests (approve / reject / remove access) and stock, prices and visibility.
Create your admin account (no email confirmation needed) with:

```bash
npm run create-admin -- you@example.com "YourPassword" "Your Name"
```

Run it again with the same email to reset that admin's password. Customers sign up on the site; to skip confirmation emails for them, turn off *Confirm email* in Supabase (Authentication > Sign In / Providers > Email).

### Approving S.K.I.F. members

Anyone can create a normal shop account. To order members-only items, a customer opens **My account** and sends a *Request member access* (member number, dojo, note).
To approve: Supabase > Table Editor > `member_requests` > set `status` to `approved` (or `rejected`). Approving automatically sets `profiles.is_member` for that customer; changing it back removes access.

## Email (Resend)

The shop sends its own emails through [Resend](https://resend.com): order received, payment received, shipped / cancelled / refunded, cancellation request received, member access approved or rejected, and alerts to you for new orders, paid orders, cancel requests and member requests.
It sends nothing until these are set in `.env.local` (and as Cloudflare secrets): `RESEND_API_KEY`, `EMAIL_FROM`, optionally `EMAIL_REPLY_TO` and `ADMIN_NOTIFY_EMAIL`.
`EMAIL_FROM` must use a domain you verified in Resend (add the DNS records in Cloudflare). For a first test, `EMAIL_FROM="S.K.I.F.-USA Shop <onboarding@resend.dev>"` works, but Resend then only delivers to the email address of your own Resend account.
Templates live in `lib/email-templates.ts`; the sending rules are in `lib/notify.ts`.

## Live online events (Zoom seminars)

Virtual products: run `supabase/migrations/0006_virtual_products.sql` (adds event fields, the private `event_access` table and the first seminar).
**Admin > Events** creates and edits events (date/time are typed in Central time and shown to customers in Eastern, Central, Mountain, Pacific and Hawaii time), shows who registered, stores the private Zoom link, and has an **Email Zoom details to attendees** button.
Customers need no shipping address for an online-only order, get one seat per order, and see the Zoom link in **My account** from 12 hours before the start (only after paying). Registration closes when the event starts. Seats are the product's stock; a cancelled or refunded paid order gives the seat back.

## Contact form

`/contact` has a form (name, email, topic, optional order number, message). Messages are saved (run `supabase/migrations/0005_contact_messages.sql`), emailed to `ADMIN_NOTIFY_EMAIL` with the visitor as Reply-To, and listed in **Admin > Messages**.
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
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run deploy
```

`NEXT_PUBLIC_*` values are inlined at build time, so also set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL` in the build environment (`.env.production` locally, or Workers Builds variables). Then add the custom domain `skifusa-shop.com` in Cloudflare Workers > Settings > Domains.

## Layout

- `app/` pages: home, products (+category filter), product detail, cart, login/signup, account, static pages
- `app/api/checkout` (login required) validates the cart against DB prices/stock and saves a `pending` order with the shipping address
- `proxy.ts` refreshes the Supabase session and protects `/account`
- `supabase/` SQL migrations with RLS (orders are only written server-side with the service role)

## Not built yet

Payments, admin UI for products/orders (use the Supabase table editor meanwhile), News section, members-only Zoom area, contact form, shipping-rate rules, transactional emails, the real legal/about text.
