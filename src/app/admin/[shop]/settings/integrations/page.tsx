import { requireShop } from "@/lib/auth";
import { getShopSettings } from "@/lib/settings";
import { Banner, PageHeader, SettingsTabs } from "@/components/ui";
import { sendTestEmail, updateIntegrationSettings } from "@/server/actions/settings";
import { absoluteUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

const TEST_MESSAGES: Record<string, string> = {
  SENT: "Test email sent successfully.",
  OUTBOX: "Test email written to the outbox. Configure Resend or a webhook for real delivery.",
  FAILED: "Test email could not be delivered. Check the provider settings and the outbox for details.",
  QUEUED: "Test email is queued."
};

export default async function IntegrationsSettingsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { saved?: string; error?: string; test?: string };
}) {
  const { shop } = await requireShop(params.shop, { owner: true });
  const settings = await getShopSettings(shop.id);

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connect payments, email delivery and analytics without writing code."
      />
      <SettingsTabs slug={shop.slug} active="integrations" />

      <div className="space-y-4">
        {searchParams?.saved ? <Banner kind="success">Integration settings saved.</Banner> : null}
        {searchParams?.error ? <Banner kind="error">{searchParams.error}</Banner> : null}
        {searchParams?.test ? (
          <Banner kind={searchParams.test === "FAILED" ? "error" : "success"}>
            {TEST_MESSAGES[searchParams.test] ?? `Test email status: ${searchParams.test}.`}
          </Banner>
        ) : null}
      </div>

      <form action={updateIntegrationSettings} className="mt-4 space-y-4">
        <input type="hidden" name="shopSlug" value={shop.slug} />

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Payments</h2>
            <p className="text-xs text-slate-500">
              Choose one provider. Every provider works without changing code; secrets stay in your
              own database.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="paymentProvider">
              Payment provider
            </label>
            <select
              id="paymentProvider"
              name="paymentProvider"
              className="input"
              defaultValue={settings.paymentProvider}
            >
              <option value="simulated">Simulated card (testing only)</option>
              <option value="manual">Manual payment (bank transfer / cash)</option>
              <option value="stripe">Stripe Checkout</option>
              <option value="custom">Custom provider (redirect + webhook)</option>
            </select>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Stripe</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="stripePublishableKey">
                  Publishable key
                </label>
                <input
                  id="stripePublishableKey"
                  name="stripePublishableKey"
                  className="input"
                  placeholder="pk_live_…"
                  defaultValue={settings.stripePublishableKey}
                />
              </div>
              <div>
                <label className="label" htmlFor="stripeSecretKey">
                  Secret key
                </label>
                <input
                  id="stripeSecretKey"
                  name="stripeSecretKey"
                  type="password"
                  className="input"
                  placeholder="sk_live_…"
                  autoComplete="off"
                  defaultValue={settings.stripeSecretKey}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="stripeWebhookSecret">
                  Webhook signing secret
                </label>
                <input
                  id="stripeWebhookSecret"
                  name="stripeWebhookSecret"
                  type="password"
                  className="input"
                  placeholder="whsec_…"
                  autoComplete="off"
                  defaultValue={settings.stripeWebhookSecret}
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Stripe webhook endpoint:{" "}
              <code className="kbd">{absoluteUrl(`/api/webhooks/stripe/${shop.slug}`)}</code> — subscribe
              to <code className="kbd">checkout.session.completed</code> and{" "}
              <code className="kbd">checkout.session.expired</code>.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Custom provider
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="customPaymentName">
                  Display name
                </label>
                <input
                  id="customPaymentName"
                  name="customPaymentName"
                  className="input"
                  placeholder="Pay by bank transfer"
                  defaultValue={settings.customPaymentName}
                />
              </div>
              <div>
                <label className="label" htmlFor="customPaymentSecret">
                  Webhook secret
                </label>
                <input
                  id="customPaymentSecret"
                  name="customPaymentSecret"
                  type="password"
                  className="input"
                  placeholder="A long random string"
                  autoComplete="off"
                  defaultValue={settings.customPaymentSecret}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="customPaymentUrl">
                  Redirect URL
                </label>
                <input
                  id="customPaymentUrl"
                  name="customPaymentUrl"
                  type="url"
                  className="input"
                  placeholder="https://payments.example.com/checkout"
                  defaultValue={settings.customPaymentUrl}
                />
                <p className="hint">
                  Customers are redirected with order, amount, currency, email, return_url, cancel_url
                  and an HMAC signature query parameter.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Payment webhook endpoint:{" "}
              <code className="kbd">{absoluteUrl(`/api/webhooks/payment/${shop.slug}`)}</code>. Send{" "}
              <code className="kbd">{`{"orderId":"…","status":"paid"}`}</code> with an{" "}
              <code className="kbd">x-openstore-signature</code> HMAC-SHA256 header.
            </p>
          </div>
        </div>

        <div id="email" className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Email delivery</h2>
            <p className="text-xs text-slate-500">
              Order confirmations and shipping updates can go to the outbox, Resend, or any HTTP
              endpoint you control.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="emailProvider">
                Email provider
              </label>
              <select
                id="emailProvider"
                name="emailProvider"
                className="input"
                defaultValue={settings.emailProvider}
              >
                <option value="outbox">Outbox (no real delivery)</option>
                <option value="resend">Resend</option>
                <option value="webhook">Custom webhook</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="emailFrom">
                From address
              </label>
              <input
                id="emailFrom"
                name="emailFrom"
                className="input"
                placeholder="Orders <orders@yourstore.com>"
                defaultValue={settings.emailFrom}
              />
            </div>
            <div>
              <label className="label" htmlFor="emailReplyTo">
                Reply-to (optional)
              </label>
              <input
                id="emailReplyTo"
                name="emailReplyTo"
                type="email"
                className="input"
                placeholder="support@yourstore.com"
                defaultValue={settings.emailReplyTo}
              />
            </div>
            <div>
              <label className="label" htmlFor="resendApiKey">
                Resend API key
              </label>
              <input
                id="resendApiKey"
                name="resendApiKey"
                type="password"
                className="input"
                placeholder="re_…"
                autoComplete="off"
                defaultValue={settings.resendApiKey}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="emailWebhookUrl">
                Email webhook URL
              </label>
              <input
                id="emailWebhookUrl"
                name="emailWebhookUrl"
                type="url"
                className="input"
                placeholder="https://your-service.example.com/email"
                defaultValue={settings.emailWebhookUrl}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="emailWebhookSecret">
                Email webhook secret
              </label>
              <input
                id="emailWebhookSecret"
                name="emailWebhookSecret"
                type="password"
                className="input"
                placeholder="Used for the x-openstore-signature header"
                autoComplete="off"
                defaultValue={settings.emailWebhookSecret}
              />
            </div>
          </div>
        </div>

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Analytics</h2>
            <p className="text-xs text-slate-500">
              Add a traffic analytics tag to every storefront page. Internal product, checkout and
              order events are always recorded in the admin.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="analyticsProvider">
              Analytics provider
            </label>
            <select
              id="analyticsProvider"
              name="analyticsProvider"
              className="input"
              defaultValue={settings.analyticsProvider}
            >
              <option value="none">None</option>
              <option value="ga4">Google Analytics 4</option>
              <option value="gtm">Google Tag Manager</option>
              <option value="plausible">Plausible</option>
              <option value="custom">Custom script URL</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="gaMeasurementId">
                GA4 measurement ID
              </label>
              <input
                id="gaMeasurementId"
                name="gaMeasurementId"
                className="input"
                placeholder="G-XXXXXXXXXX"
                defaultValue={settings.gaMeasurementId}
              />
            </div>
            <div>
              <label className="label" htmlFor="gtmContainerId">
                GTM container ID
              </label>
              <input
                id="gtmContainerId"
                name="gtmContainerId"
                className="input"
                placeholder="GTM-XXXXXXX"
                defaultValue={settings.gtmContainerId}
              />
            </div>
            <div>
              <label className="label" htmlFor="plausibleDomain">
                Plausible domain
              </label>
              <input
                id="plausibleDomain"
                name="plausibleDomain"
                className="input"
                placeholder="store.example.com"
                defaultValue={settings.plausibleDomain}
              />
            </div>
            <div>
              <label className="label" htmlFor="customAnalyticsScriptUrl">
                Custom script URL
              </label>
              <input
                id="customAnalyticsScriptUrl"
                name="customAnalyticsScriptUrl"
                type="url"
                className="input"
                placeholder="https://analytics.example.com/script.js"
                defaultValue={settings.customAnalyticsScriptUrl}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Save integrations
          </button>
        </div>
      </form>

      <div className="card card-pad mt-6">
        <h2 className="section-title">Send a test email</h2>
        <p className="mt-1 text-xs text-slate-500">
          Save your email settings first, then send a message to verify delivery.
        </p>
        <form action={sendTestEmail} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="shopSlug" value={shop.slug} />
          <div className="min-w-[240px] flex-1">
            <label className="label" htmlFor="test-email">
              Recipient
            </label>
            <input
              id="test-email"
              name="to"
              type="email"
              className="input"
              defaultValue={shop.email}
              required
            />
          </div>
          <button type="submit" className="btn btn-outline">
            Send test email
          </button>
        </form>
      </div>
    </div>
  );
}
