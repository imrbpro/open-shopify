import { requireShop } from "@/lib/auth";
import { updateGeneralSettings } from "@/server/actions/settings";
import { Banner, PageHeader, SettingsTabs } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
const COUNTRIES = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["AU", "Australia"],
  ["JP", "Japan"],
  ["TR", "Türkiye"]
];
const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Asia/Tokyo",
  "Australia/Sydney"
];

export default async function GeneralSettingsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop, { owner: true });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your store profile, locale and preferences." />
      <SettingsTabs slug={shop.slug} active="general" />

      <div className="space-y-4">
        {searchParams?.saved ? <Banner kind="success">Store settings saved.</Banner> : null}
        {searchParams?.error ? <Banner kind="error">{searchParams.error}</Banner> : null}
      </div>

      <form action={updateGeneralSettings} className="mt-4 space-y-4">
        <input type="hidden" name="shopSlug" value={shop.slug} />

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Store details</h2>
            <p className="text-xs text-slate-500">Shown to customers on receipts, emails and your storefront.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Store name
              </label>
              <input id="name" name="name" className="input" defaultValue={shop.name} required />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Store email
              </label>
              <input id="email" name="email" type="email" className="input" defaultValue={shop.email} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input"
                defaultValue={shop.description ?? ""}
                placeholder="A short description of what you sell."
              />
              <p className="hint">Used in storefront metadata and the footer.</p>
            </div>
          </div>
        </div>

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Locale</h2>
            <p className="text-xs text-slate-500">Currency, country and timezone for reporting.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="currency">
                Currency
              </label>
              <select id="currency" name="currency" className="input" defaultValue={shop.currency}>
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="country">
                Country
              </label>
              <select id="country" name="country" className="input" defaultValue={shop.country}>
                {COUNTRIES.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="timezone">
                Timezone
              </label>
              <select id="timezone" name="timezone" className="input" defaultValue={shop.timezone}>
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Store addresses</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-700">
                /admin/{shop.slug}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Storefront</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-700">/s/{shop.slug}</p>
            </div>
          </div>
          <p className="hint flex items-center gap-1.5">
            <Icon name="external" className="h-3.5 w-3.5" />
            In production these map to custom domains configured in your hosting platform.
          </p>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
