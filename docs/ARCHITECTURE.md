# Architecture

OpenStore is a Next.js App Router application backed by Prisma. It is designed as a compact,
inspectable commerce core rather than a distributed platform. This document describes the moving
parts and the invariants that keep them consistent.

## Request flow

- **Admin pages** (`/admin/[shop]`) call `requireShop(slug)` to resolve the shop, membership and role.
  Owner-only pages pass `{ owner: true }`. Server actions re-check the same context; page-level checks
  are not trusted on their own.
- **Storefront pages** (`/s/[shop]`) call `getStore(slug)`, which loads the shop, its main theme, the
  parsed settings and active app installations. The layout applies theme CSS variables and wraps the
  tree in a cart provider and a browser-local discovery provider.
- **Checkout** is a server action. The client sends variant IDs and quantities only; the server
  reloads variants, validates inventory, reapplies discounts, shipping and tax, and creates the order.
  Client-side totals are display-only.
- **API routes** (`/api/v1/*`) authenticate a scoped token and return JSON. Provider webhooks verify
  signatures against the raw request body before mutating orders.

## Data model

The Prisma schema groups tables into identity/tenancy, catalog, customers, orders, marketing/content
and platform concerns. All identifiers are CUID strings and status values are portable strings so the
schema can run on SQLite and PostgreSQL without enums.

Key relationships:

- `User` ↔ `Shop` through `Membership` with `OWNER` or `STAFF` roles.
- `Shop` owns products, collections, customers, orders, discounts, themes, pages, posts, shipping
  rates, settings, app installations, API keys, webhooks, reviews, events and email messages.
- `Product` owns variants, images, collection links and reviews. Orders reference variants by ID and
  also denormalize title, SKU, image and price so history survives catalog edits.
- `Order` owns items, fulfillments, refunds and timeline events. `paymentRef` stores an external
  session or provider reference.
- `Theme` stores a validated `ThemeConfig` JSON document. Exactly one theme is `MAIN`.
- `App` is global; `AppInstallation` is per shop. Built-in app handles are defined in
  `src/lib/apps.ts` and are checked at render time.

## Orders and payments

All orders start as `PENDING`. `customer.ordersCount` increments at creation, not at payment, so
abandoned and pending orders are visible in customer history.

`src/lib/orders.ts` owns the two critical transitions:

- `markOrderPaid(orderId, options)` claims the order with an atomic `updateMany` from `PENDING` or
  `AUTHORIZED` to `PAID`, increments `totalSpent`, appends a timeline event, sends the confirmation
  email, dispatches `orders/paid` and records `order_completed`. Repeated calls are idempotent.
- `cancelPendingOrder(orderId, reason)` claims an unpaid order as `CANCELLED`, restocks inventory,
  releases discount usage, decrements `ordersCount`, appends a timeline event and dispatches
  `orders/cancelled`.

Payment providers:

- `simulated` calls `markOrderPaid` immediately after order creation.
- `manual` queues a `payment_instructions` email and leaves the order pending. An owner or staff
  member can mark it paid from the order detail page.
- `stripe` creates a Checkout Session with server-computed totals, stores the session ID in
  `paymentRef`, and redirects. The signed Stripe webhook or the verified return route calls
  `markOrderPaid`.
- `custom` builds a signed redirect URL. The provider reports back through the payment webhook or
  the signed return/cancel routes.

Cancellation tokens are HMACs of `cancel:<orderId>` using `AUTH_SECRET`. Custom payment URLs sign the
full query string with the per-shop `customPaymentSecret`.

## Email

`queueEmail` writes an `EmailMessage` row first, then attempts delivery according to the configured
provider. Outbox mode updates the row to `OUTBOX`; Resend and webhook delivery update it to `SENT` or
`FAILED` with an error summary. Email failures never throw into checkout or payment processing.
Shipping notifications use templates from shop settings with `{{variable}}` substitution.

## Themes

`src/lib/theme.ts` defines the default theme, six presets, safe parsing and CSS variable generation.
`parseThemeConfig` deep-merges against defaults, so partial or corrupt JSON cannot break a storefront.
The theme editor updates colors, fonts, hero content, announcement and footer copy; changing the preset
rebuilds the base config.

## Apps

Built-in apps are not executable plugins. They are capability flags installed per shop:

- `product-reviews` gates review lists/forms on product pages.
- `email-marketing` gates the newsletter form in the footer.
- `wishlist` gates save buttons and the wishlist page.
- `recently-viewed` gates the browsing-history rail.

Wishlist and recently viewed data live in browser `localStorage`; reviews and newsletter signups live
in the database. Uninstalling an app removes the storefront surface immediately without deleting
historical data.

## API and webhooks

API tokens are shop-scoped with comma-separated scopes. The `/api/v1/*` routes currently expose shop
metadata, products and orders. Admin API requests accept `Authorization: Bearer <token>` or the
`x-openstore-access-token` header.

Outgoing webhooks serialize `{ topic, shop, triggered_at, data }`, sign the raw body with the
subscription secret as `x-openstore-hmac-sha256`, and send `x-openstore-topic`. Delivery attempts are
logged in `WebhookDelivery` with response code or error. There is no retry worker; consumers should be
idempotent.

## Security boundaries

- Session JWTs are signed with `AUTH_SECRET` and stored in an HTTP-only cookie.
- Passwords are hashed with bcrypt.
- Owner-only actions cover settings, staff, API keys, webhooks and integrations.
- Provider secrets are stored in `ShopSetting` rows. Database backups must be treated as secrets.
- Webhook verification must use the raw request body, not re-stringified JSON.
- The app has no built-in media upload pipeline; product images are URLs. Use trusted sources or a
  separate object-storage uploader before allowing untrusted staff to set arbitrary URLs.

## Deliberate limits

This project is intentionally synchronous and single-node by default. There is no background job
queue, distributed transaction, tax jurisdiction engine, shipping-carrier integration, media pipeline
or real-time collaboration. Those are extension points rather than hidden dependencies. See
`docs/SELF_HOSTING.md` for deployment guidance and the path to PostgreSQL.
