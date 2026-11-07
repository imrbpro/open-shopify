# Self-hosting OpenStore

OpenStore runs as a single Node.js process with a SQLite database by default. This guide covers the
supported Docker path, manual deployment, HTTPS, backups, upgrades, provider configuration and the
move to PostgreSQL.

## Docker Compose (recommended)

Requirements: Docker Engine with Compose v2.

```bash
cp .env.example .env
# edit .env:
#   AUTH_SECRET=...   (32+ random bytes)
#   APP_URL=https://store.example.com
docker compose up -d --build
```

The container:

- applies the Prisma schema with `prisma db push` on startup;
- stores the database in the named volume `openstore_data` at `/data/openstore.db`;
- runs `next start` on port `3000`.

Create the first store at `https://<your-host>/signup`, or load the fictional demo data into a fresh
volume:

```bash
docker compose exec app npx tsx prisma/seed.ts
```

Warning: the seed clears existing data. Never run it against a live store.

View logs and stop the stack:

```bash
docker compose logs -f app
docker compose down
```

## Manual deployment

Requirements: Node.js 20+, npm, and a writable location for the SQLite file.

```bash
cp .env.example .env
# set AUTH_SECRET and APP_URL
npm ci
npm run build
npx prisma db push
npm start
```

Use a process supervisor (systemd, PM2, Docker or your platform's runner) to keep `npm start` alive.
Run a single application instance when using SQLite.

Example systemd unit:

```ini
[Unit]
Description=OpenStore
After=network.target

[Service]
WorkingDirectory=/srv/openstore
EnvironmentFile=/srv/openstore/.env
ExecStart=/usr/bin/npm start
Restart=always
User=openstore

[Install]
WantedBy=multi-user.target
```

## HTTPS and reverse proxy

Terminate TLS at a reverse proxy such as Caddy, nginx or Traefik and forward to port 3000. Set
`APP_URL` to the public HTTPS origin; Stripe and custom payment return URLs are generated from it.

Caddy example:

```caddyfile
store.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

If you run behind a proxy that adds forwarding headers, keep Next.js's default host handling and
ensure the proxy preserves `X-Forwarded-Proto` and `Host`.

## Backups

For SQLite, back up the volume or the database file while the app is stopped or use SQLite's online
backup mechanism. A simple cold backup:

```bash
docker compose stop app
docker run --rm -v openstore_openstore_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/openstore-backup.tgz -C /data .
docker compose start app
```

For PostgreSQL, use `pg_dump` on a schedule. Backups contain shop data, customer records, provider
credentials and webhook secrets. Encrypt them and restrict access.

## Upgrade procedure

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

The entrypoint runs `prisma db push` to apply additive schema changes. For major upgrades, take a
backup first and review the release notes. There is no automated rollback.

## Provider configuration

All provider settings are under **Admin → Settings → Integrations**.

### Stripe

1. Add `pk_…`, `sk_…` and the endpoint signing secret `whsec_…`.
2. Register `https://<store-host>/api/webhooks/stripe/<shop-slug>`.
3. Enable `checkout.session.completed` and `checkout.session.expired`.

The webhook signature is verified against the raw body, and orders remain pending until Stripe
confirms. The return route also retrieves the session directly before marking an order paid.

### Custom payments

The custom provider redirects to your URL with these query parameters:

- `order`, `order_number`, `amount` (minor units), `currency`, `email`
- `return_url`, `cancel_url`
- `signature` — HMAC-SHA256 of the URL-encoded query string, excluding `signature`, using the shop's
  custom payment secret.

Your provider confirms payment by POSTing JSON to
`https://<store-host>/api/webhooks/payment/<shop-slug>` with header
`x-openstore-signature` (hex HMAC-SHA256 of the raw body). Accepted paid statuses:
`paid`, `succeeded`, `completed`. Accepted cancellation statuses: `cancelled`, `canceled`, `failed`,
`expired`.

Return and cancel URLs sent to your provider are signed with the same order cancel token, so OpenStore
verifies them before changing the order.

### Email

- **Outbox** is the safe default: messages are recorded but not sent.
- **Resend** requires an API key and a verified from address.
- **Webhook** sends signed JSON to your endpoint. The signature uses
  `x-openstore-signature` and the configured email webhook secret.

Use the test email form on the Integrations page after saving. Delivery status and errors appear under
**Settings → Notifications**.

### Analytics

Set GA4, GTM, Plausible or a custom script URL. Custom scripts are loaded on storefront pages only;
admin pages are not instrumented. Review third-party scripts for consent requirements in your
jurisdiction.

## PostgreSQL

SQLite is the default and is fine for a single-instance store. To use PostgreSQL:

1. Change the Prisma datasource provider in `prisma/schema.prisma` from `sqlite` to `postgresql`.
2. Set `DATABASE_URL` to your PostgreSQL connection string, for example
   `postgresql://openstore:password@db:5432/openstore?schema=public`.
3. Run `npx prisma generate` and `npx prisma db push`.
4. Seed only if you want demo data.

There is no automatic SQLite-to-PostgreSQL migration. Export and import data with a script or start
with an empty database. Test the storefront search and collection queries after switching, because
case sensitivity and collation differ between engines.

## Operating checklist

- Set a unique, long `AUTH_SECRET`; rotating it invalidates sessions and payment cancel tokens.
- Set `APP_URL` to the canonical HTTPS origin.
- Configure backups and test a restore.
- Keep provider secrets out of logs and screenshots.
- Restrict admin access to trusted operators; staff can view orders and customers.
- Configure outbound firewall access for Stripe, Resend, analytics and your webhook targets.
- Serve product images from HTTPS origins you trust. The default app has no media upload pipeline.
- Monitor container logs for failed webhooks and email delivery errors shown in the admin.
