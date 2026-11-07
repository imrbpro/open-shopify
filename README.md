# open-shopify

An open, reverse-engineered commerce platform inspired by Shopify: multi-tenant admin, themed storefront, real cart and checkout, plans and billing, public API and webhooks.

Built from scratch in TypeScript with Next.js App Router, Prisma and SQLite (PostgreSQL-ready). Not affiliated with or endorsed by Shopify — see [docs/REA.md](docs/REA.md) for the reverse-engineering analysis.

## Demo

```bash
npm install
npm run setup     # prisma db push + seed demo data
npm run dev
```

- Marketing site: http://localhost:3000
- Storefront: http://localhost:3000/s/demo
- Admin: http://localhost:3000/admin/demo
- Owner login: `owner@demo.com` / `demo1234`
- Staff login: `staff@demo.com` / `demo1234`

The seed creates "Northwind Supply" with 12 products, 11 orders, 8 customers, 4 discounts, 3 themes, installed apps, invoices and an API key.

## Feature map

| Area | What is implemented |
| --- | --- |
| Tenancy & auth | Shops, memberships, owner/staff roles, JWT session cookie, signup and login |
| Catalog | Products, variants, inventory, images, tags, vendors, types, statuses, collections (manual + rule-based automated) |
| Orders | Pending/paid/refunded/cancelled states, fulfillment, refunds, cancellation with restock, timeline, notes, packing slips |
| Customers | Profiles, addresses, order history, lifetime spend, tags, marketing opt-in |
| Discounts | Percentage, fixed amount, free shipping, minimums, usage limits, schedules, per-customer limits |
| Content | Pages and blog posts with publishing from admin |
| Online store | Three theme presets, live theme customizer, announcement bar, nav, hero, collections, product pages, search, journal, footer |
| Storefront | Persistent cart, variant picker, stock checks, themed pages, reviews (Judge.me/Fera), newsletter (Klaviyo) |
| Checkout | Server-repriced cart, discount preview, shipping rates with free-over thresholds, tax, simulated card/manual payments, confirmation page and order lookup |
| Insights | Analytics dashboard with revenue chart, funnel, top products, most viewed products, event stream |
| Settings | Store profile and locale, checkout/payment/tax options, shipping rates, email templates and outbox, staff seats, API keys, webhooks |
| Billing | Five plans, trials, usage limits, plan switching with downgrade guards, cancel/reactivate, invoices, storefront freeze |
| Platform | Admin API (`/api/v1`), token scopes, HMAC-signed webhooks with delivery log, health check |
| Apps | App store with install/uninstall, capability-gated reviews and newsletter |

## Stack

- Next.js 14 (App Router, server actions), React 18, TypeScript
- Tailwind CSS with a shared admin design system and CSS-variable storefront theming
- Prisma 5 + SQLite for zero-config local development (PostgreSQL schema notes below)
- `jose` JWT sessions, `bcryptjs` password hashing, `zod` request validation
- Vitest unit tests for pricing, discounts, plans, catalog rules, theming and utilities

## Routes

```
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
/admin/[shop]/apps             app store
/admin/[shop]/analytics        sales + funnel analytics
/admin/[shop]/settings/*       general, checkout, notifications, users, api, webhooks
/admin/[shop]/billing          plans, usage, invoices

/s/[shop]                      themed storefront home
/s/[shop]/collections/[handle] collection/all products
/s/[shop]/products/[handle]    product detail + reviews
/s/[shop]/search               product search
/s/[shop]/cart                 cart
/s/[shop]/checkout             checkout
/s/[shop]/thank-you/[number]   receipt
/s/[shop]/order-lookup         order lookup
/s/[shop]/pages/[handle]       content page
/s/[shop]/blog, /blog/[handle] journal

/api/health                    service + database check
/api/v1/shop                   current shop
/api/v1/products               GET list, POST create
/api/v1/orders                 GET list
```

## Admin API

Authenticate with `Authorization: Bearer <token>` or `X-Open-Shopify-Access-Token: <token>`.
The seeded demo key is `os_demo_1234567890abcdef` (scopes: read/write products, read orders).

```bash
curl http://localhost:3000/api/v1/products?limit=5 \
  -H "X-Open-Shopify-Access-Token: os_demo_1234567890abcdef"

curl -X POST http://localhost:3000/api/v1/products \
  -H "X-Open-Shopify-Access-Token: os_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"title":"Market Tote","status":"ACTIVE","variants":[{"title":"Default","price":2900,"inventoryQty":20}]}'
```

Prices are integer cents. New keys are generated under **Settings → API keys**.

## Webhooks

Subscribe to topics such as `orders/create`, `orders/paid`, `orders/fulfilled`, `orders/refunded`, `products/create`, `customers/create` and `app/uninstalled` under **Settings → Webhooks**. Requests include:

- `X-Open-Shopify-Topic`
- `X-Open-Shopify-Hmac-Sha256` (HMAC-SHA256 of the raw JSON body)

Deliveries are logged with response codes. Use **Send test** to verify an endpoint.

## Plans

| Plan | Monthly | Products | Staff | Third-party fee |
| --- | --- | --- | --- | --- |
| Starter | $5 | 100 | 1 | 5% |
| Basic | $39 | Unlimited | 5 | 2% |
| Shopify | $105 | Unlimited | 15 | 1% |
| Advanced | $399 | Unlimited | 50 | 0.5% |
| Plus | $2,300 | Unlimited | Unlimited | 0.15% |

New stores start a 14-day trial. Downgrades are blocked when current usage exceeds the target plan. Cancelling freezes the storefront and disables checkout until reactivation.

## Environment

```ini
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-string"
```

Copy `.env.example` to `.env` and set a strong `AUTH_SECRET` for anything beyond local use.

## Database

SQLite keeps local setup to a single file. To run PostgreSQL:

1. Set the datasource provider to `postgresql` in `prisma/schema.prisma`.
2. Point `DATABASE_URL` at your database (e.g. `postgresql://user:pass@localhost:5432/openshopify`).
3. Run `npm run setup`.

The schema deliberately stores enums and JSON as strings for portability; no migration history is committed because the project ships as a seedable reference implementation.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest unit suite |
| `npm run db:push` | Push schema to the database |
| `npm run db:seed` | Reseed demo data |
| `npm run setup` | Schema push + seed |

## Project layout

```
src/app            routes: marketing, auth, admin, storefront, api
src/components     admin UI, storefront client components, design primitives
src/lib            domain logic: auth, plans, money, discounts, themes, catalog, webhooks
src/server/actions server actions: admin CRUD, settings, billing, checkout, storefront
prisma             schema + deterministic demo seed
scripts            generated SVG asset script
docs/REA.md        reverse-engineering analysis and design decisions
```

## Deliberate demo limits

Payments, emails and app billing are simulated. There is no real payment gateway, email delivery, tax jurisdiction engine, media upload pipeline or background worker; these run inline so the full flow is observable locally. Inventory decrements are best-effort and not wrapped in a distributed transaction.

## License

MIT — see [LICENSE](LICENSE).

"Shopify" is a trademark of Shopify Inc.; this project is an independent educational reconstruction and is not affiliated with them.
