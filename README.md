# OpenStore

OpenStore is an independent, self-hosted commerce platform for running a real store without a
platform subscription. It includes a multi-tenant admin, six original storefront themes, checkout
with provider-agnostic payments, built-in marketing apps, an admin REST API and signed webhooks.

Built with Next.js App Router, TypeScript, Prisma and SQLite (PostgreSQL-ready). Everything runs from
one codebase you can inspect, fork and deploy.

> OpenStore is not affiliated with, endorsed by, or derived from Shopify Inc. or any other commerce
> provider. See [NOTICE](NOTICE) for the trademark disclaimer.

## Highlights

| Area | What is included |
| --- | --- |
| Tenancy & auth | Shops, memberships, owner/staff roles, JWT sessions, signup and login |
| Catalog | Products, variants, inventory, images, tags, vendors, types, statuses, manual and rule-based collections |
| Orders | Pending, paid, refunded and cancelled states; fulfillment, refunds, cancellation with restock, timeline, notes and packing slips |
| Customers | Profiles, addresses, order history, lifetime spend, tags and marketing opt-in |
| Discounts | Percentage, fixed amount, free shipping, minimums, usage limits, schedules and per-customer limits |
| Content | Pages and blog posts with publishing from the admin |
| Storefront | Six themes, live customizer, announcement bar, navigation, hero, collections, product pages, search, journal, blog and footer |
| Checkout | Server-repriced cart, discounts, shipping rates, tax, simulated/manual/Stripe/custom payments, confirmation and order lookup |
| Built-in apps | Product reviews, email marketing, wishlist and recently viewed — included for every store |
| Integrations | Stripe or custom payment providers, Resend or webhook email delivery, GA4/GTM/Plausible/custom analytics |
| Insights | Revenue chart, funnel, top products, most viewed products and event stream |
| Platform | Scoped admin API tokens, signed webhook delivery log and health check |
| Self-hosting | Docker image, Compose stack, SQLite volume, configurable public URL and documented provider setup |

There is no plan, trial, seat, invoice or billing module. All features are available to every store.

## Quick start

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env
# set AUTH_SECRET in .env to a long random string
npm install
npm run setup     # create the SQLite schema and seed demo data
npm run dev
```

Open:

- Marketing site: http://localhost:3000
- Storefront: http://localhost:3000/s/demo
- Admin: http://localhost:3000/admin/demo
- Owner login: `owner@demo.com` / `demo1234`
- Staff login: `staff@demo.com` / `demo1234`

The seed creates Northwind Supply with 12 products, 11 orders across every status, 8 customers,
4 discounts, all six themes, all four built-in apps, reviews, blog posts, an API token and a webhook
configuration.

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Docker

```bash
cp .env.example .env
# set AUTH_SECRET and APP_URL in .env
docker compose up -d --build
```

The container applies the schema on start and stores SQLite data in the `openstore_data` volume. The
first visit can create a store through `/signup`. To load the demo data into a fresh Docker volume
(this is destructive):

```bash
docker compose exec app npx tsx prisma/seed.ts
```

See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for reverse-proxy, backup, upgrade and provider
configuration guidance.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite path such as `file:./dev.db`, or a PostgreSQL connection string after switching the Prisma provider |
| `AUTH_SECRET` | Yes | Signs session cookies and payment cancel tokens; use at least 32 random bytes |
| `APP_URL` | Recommended | Public base URL used in Stripe return URLs, custom payment callbacks and provider webhook hints |
| `NEXT_PUBLIC_APP_URL` | Optional | Client-visible alternative to `APP_URL` |
| `PORT` | Optional | Server port, defaults to `3000` |

Provider API keys and webhook secrets are stored in the shop database and are managed in the admin.
They are never committed to this repository.

## Payment providers

Configure under **Admin → Settings → Integrations**.

| Provider | Behavior |
| --- | --- |
| `simulated` | Development default. The order is created and immediately marked paid by the test gateway. |
| `manual` | Order stays pending, the customer receives payment instructions, and an admin marks it paid when funds clear. |
| `stripe` | Creates a Stripe Checkout Session and redirects the customer. The order becomes paid only after the signed Stripe webhook or verified return. |
| `custom` | Redirects to a provider URL with signed order parameters. The provider calls the payment webhook to report `paid` or `cancelled`. |

Stripe setup:

1. Add the publishable key, secret key and webhook signing secret in Integrations.
2. Register `https://your-store.example.com/api/webhooks/stripe/<shop-slug>` with Stripe.
3. Subscribe to `checkout.session.completed` and `checkout.session.expired`.

Custom provider contract:

- Redirect query parameters: `order`, `order_number`, `amount`, `currency`, `email`, `return_url`,
  `cancel_url` and `signature` (HMAC-SHA256 over the URL-encoded query string).
- Notify `POST /api/webhooks/payment/<shop-slug>` with an
  `x-openstore-signature` HMAC-SHA256 header and JSON such as
  `{"orderId":"…","status":"paid"}`. Cancellation statuses are
  `cancelled`, `canceled`, `failed` and `expired`.
- Return and cancel URLs are also HMAC-signed, so the store can verify them without trusting the
  provider session.

## Email providers

Configure under **Admin → Settings → Integrations**.

| Provider | Behavior |
| --- | --- |
| `outbox` | Stores messages and delivery metadata in the admin log without sending. Default for local development. |
| `resend` | Sends plain-text email through Resend using the configured API key and from address. |
| `webhook` | POSTs a signed JSON payload to an HTTP endpoint you control. |

Every email is recorded with status (`QUEUED`, `SENT`, `OUTBOX`, `FAILED`), provider, timestamp and
error details in **Settings → Notifications**. A test email action is available on the Integrations
page.

## Analytics

| Provider | Behavior |
| --- | --- |
| `none` | No third-party tag. |
| `ga4` | Loads Google Analytics 4 with the configured measurement ID. |
| `gtm` | Loads Google Tag Manager with the configured container ID. |
| `plausible` | Loads Plausible for the configured domain. |
| `custom` | Loads a script URL you provide. |

Internal product, checkout and order events are always recorded in the admin regardless of the
external provider.

## Themes

All six presets are original to this project and ship as starting points:

- **Classic** — calm, editorial, warm teal accents
- **Noir** — dark, high contrast, crimson accents
- **Meadow** — natural serif palette for pantry and garden goods
- **Mono** — Swiss restraint in black and warm white
- **Coastal** — airy blues for travel and outdoor brands
- **Ember** — rich oranges and browns for food and craft

Themes are stored as validated JSON (`ThemeConfig`) and applied with CSS variables. Exactly one theme
is `MAIN`; the storefront falls back to the oldest theme when none is published.

## Built-in apps

| App | Storefront behavior |
| --- | --- |
| Product Reviews | Star ratings, review lists and a review form on product pages |
| Email Marketing | Newsletter signup capture in the storefront footer |
| Wishlist | Save buttons on product cards and pages plus a per-browser wishlist page |
| Recently Viewed | A browsing-history rail on the home page and product pages |

Apps are installed per store and checked at render time. There is no marketplace account, external
service or per-app charge.

## Order lifecycle

1. Checkout validates cart lines and reprices everything on the server.
2. Inventory is reserved and the order is created as `PENDING`; the customer's order count increments.
3. Payment behavior depends on the chosen provider.
4. `markOrderPaid` transitions the order to `PAID`, increments lifetime spend, sends the confirmation
   email, dispatches `orders/paid` and records `order_completed`.
5. Cancelling an unpaid order restocks inventory, releases discount usage, decrements the customer's
   order count and dispatches `orders/cancelled`.
6. Refunds update the financial status to `PARTIALLY_REFUNDED` or `REFUNDED` and dispatch
   `orders/refunded`.

## Routes

```text
/                              marketing landing + auth entry
/login  /signup                account access

/admin/[shop]                  dashboard
/admin/[shop]/orders           orders list, detail, packing slip
/admin/[shop]/products         products list, create, edit
/admin/[shop]/collections      collections list, create, edit
/admin/[shop]/customers        customers list, create, detail
/admin/[shop]/discounts        discounts list, create, edit
/admin/[shop]/content/pages    page publishing
/admin/[shop]/content/blog     blog publishing
/admin/[shop]/online-store/themes   theme list + customizer
/admin/[shop]/apps             built-in apps
/admin/[shop]/analytics        sales + funnel analytics
/admin/[shop]/settings/*       general, checkout, integrations, notifications, users, api, webhooks

/s/[shop]                      themed storefront home
/s/[shop]/collections/[handle] collection/all products
/s/[shop]/products/[handle]    product detail + reviews + wishlist
/s/[shop]/search               product search
/s/[shop]/wishlist             saved products
/s/[shop]/cart                 cart
/s/[shop]/checkout             checkout
/s/[shop]/thank-you/[number]   receipt
/s/[shop]/order-lookup         order lookup
/s/[shop]/pages/[handle]       content page
/s/[shop]/blog, /blog/[handle] journal
```

## Admin API

Create a token in **Settings → API**. Pass it as `Authorization: Bearer <token>` or with the
`x-openstore-access-token` header.

- `GET /api/v1/shop` — shop, theme, providers, settings and installed apps
- `GET /api/v1/products` — paginated product list, requires `read_products`
- `GET /api/v1/orders` — paginated order list, requires `read_orders`
- `GET /api/health` — health check

## Webhooks

Create subscriptions in **Settings → Webhooks**. Deliveries are signed with
`x-openstore-hmac-sha256` (hex HMAC-SHA256 of the raw body) and include `x-openstore-topic`. A
delivery log is available in the admin.

Supported topics: `orders/create`, `orders/paid`, `orders/fulfilled`, `orders/cancelled`,
`orders/refunded`, `products/create`, `products/update`, `products/delete`, `customers/create` and
`app/uninstalled`.

## Development

```bash
npm run typecheck
npm test
npm run build
npm run db:push
npm run db:seed
```

Project layout:

```text
prisma/              schema and demo seed
public/images/       product, hero and brand artwork
scripts/             asset generation
src/app/             App Router pages and API routes
src/components/      admin and storefront UI
src/lib/             domain logic: orders, payments, email, settings, themes, apps
src/server/actions/  server actions for admin and storefront
docs/                architecture and self-hosting guides
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the data model, order flow and integration
contracts.

## Production notes

- Serve behind HTTPS. Set `APP_URL` to the public origin; Stripe and custom providers need reachable
  callback URLs.
- Back up the SQLite volume (or PostgreSQL database) regularly. Provider secrets live in the database,
  so backups are sensitive.
- SQLite is suitable for a single application instance. Move to PostgreSQL before scaling horizontally
  (see [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md)).
- The built-in server runs long-lived HTTP requests inline; there is no background worker. Email,
  webhooks and analytics failures are recorded but never block checkout.
- Review the owner-only surfaces (settings, API keys, webhooks, integrations) before exposing the
  admin to a team.

## Contributing and funding

Issues and pull requests are welcome. Development setup is above; run typecheck, tests and a
production build before opening a pull request. Funding configuration lives in
[.github/FUNDING.yml](.github/FUNDING.yml).

## License and trademarks

MIT — see [LICENSE](LICENSE). OpenStore is an independent project. “Shopify” is a trademark of
Shopify Inc.; it is used in this repository only for nominative, non-affiliation context. See
[NOTICE](NOTICE).
