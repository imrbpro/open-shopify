import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getShopSettings } from "@/lib/settings";
import { formatMoneyExact, moneyInputValue } from "@/lib/money";
import {
  createShippingRate,
  deleteShippingRate,
  updateCheckoutSettings,
  updateShippingRate
} from "@/server/actions/settings";
import { Banner, PageHeader, SettingsTabs } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";

export const dynamic = "force-dynamic";

export default async function CheckoutSettingsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop, { owner: true });
  const [settings, rates] = await Promise.all([
    getShopSettings(shop.id),
    prisma.shippingRate.findMany({ where: { shopId: shop.id }, orderBy: { price: "asc" } })
  ]);

  return (
    <div>
      <PageHeader title="Checkout" subtitle="Taxes, shipping and checkout behavior." />
      <SettingsTabs slug={shop.slug} active="checkout" />

      <div className="space-y-4">
        {searchParams?.saved ? <Banner kind="success">Checkout settings saved.</Banner> : null}
        {searchParams?.error ? <Banner kind="error">{searchParams.error}</Banner> : null}
      </div>

      <form action={updateCheckoutSettings} className="mt-4 space-y-4">
        <input type="hidden" name="shopSlug" value={shop.slug} />

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Taxes</h2>
            <p className="text-xs text-slate-500">Flat rate applied to the order subtotal at checkout.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="taxRatePct">
                Tax rate (%)
              </label>
              <input
                id="taxRatePct"
                name="taxRatePct"
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="input"
                defaultValue={settings.taxRatePct}
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="taxShipping"
                defaultChecked={settings.taxShipping}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Also tax shipping charges
            </label>
          </div>
        </div>

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Checkout experience</h2>
            <p className="text-xs text-slate-500">
              Notes, inventory alerts and marketing opt-in. Payment and email providers live in{" "}
              <a href={`/admin/${shop.slug}/settings/integrations`} className="font-medium text-emerald-700 underline">
                Integrations
              </a>
              .
            </p>
          </div>
          <div>
            <label className="label" htmlFor="checkoutNote">
              Checkout note
            </label>
            <textarea
              id="checkoutNote"
              name="checkoutNote"
              rows={2}
              className="input"
              defaultValue={settings.checkoutNote}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="lowStockThreshold">
                Low stock threshold
              </label>
              <input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                className="input"
                defaultValue={settings.lowStockThreshold}
              />
              <p className="hint">Products at or below this quantity are flagged in admin.</p>
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="newsletterEnabled"
                defaultChecked={settings.newsletterEnabled}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Show newsletter signup in the storefront footer
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Save checkout settings
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="card card-pad lg:col-span-2">
          <h2 className="section-title">Add shipping rate</h2>
          <p className="mb-4 text-xs text-slate-500">
            Rates are offered at checkout. Leave &ldquo;free over&rdquo; at 0 to always charge.
          </p>
          <form action={createShippingRate} className="space-y-3">
            <input type="hidden" name="shopSlug" value={shop.slug} />
            <div>
              <label className="label" htmlFor="rate-name">
                Name
              </label>
              <input id="rate-name" name="name" className="input" placeholder="Standard shipping" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="rate-price">
                  Price
                </label>
                <input id="rate-price" name="price" type="number" step="0.01" min="0" className="input" defaultValue="5.00" />
              </div>
              <div>
                <label className="label" htmlFor="rate-min">
                  Free over
                </label>
                <input id="rate-min" name="minSubtotal" type="number" step="0.01" min="0" className="input" defaultValue="0" />
              </div>
            </div>
            <button type="submit" className="btn btn-dark w-full">
              Add rate
            </button>
          </form>
        </div>

        <div className="card overflow-hidden lg:col-span-3">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="section-title">Shipping rates</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {rates.map((rate) => {
              const freeOver = rate.minSubtotal > 0;
              return (
                <div key={rate.id} className="p-4">
                  <form action={updateShippingRate} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="shopSlug" value={shop.slug} />
                    <input type="hidden" name="id" value={rate.id} />
                    <div className="min-w-[140px] flex-1">
                      <label className="label">Name</label>
                      <input name="name" className="input input-sm" defaultValue={rate.name} />
                    </div>
                    <div className="w-24">
                      <label className="label">Price</label>
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="input input-sm"
                        defaultValue={moneyInputValue(rate.price)}
                      />
                    </div>
                    <div className="w-28">
                      <label className="label">Free over</label>
                      <input
                        name="minSubtotal"
                        type="number"
                        step="0.01"
                        min="0"
                        className="input input-sm"
                        defaultValue={moneyInputValue(rate.minSubtotal)}
                      />
                    </div>
                    <label className="flex items-center gap-1.5 pb-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={rate.active}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600"
                      />
                      Active
                    </label>
                    <button type="submit" className="btn btn-outline btn-sm">
                      Save
                    </button>
                  </form>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      {freeOver
                        ? `Free when subtotal reaches ${formatMoneyExact(rate.minSubtotal, shop.currency)}`
                        : `Always ${formatMoneyExact(rate.price, shop.currency)}`}
                    </p>
                    <form action={deleteShippingRate}>
                      <input type="hidden" name="shopSlug" value={shop.slug} />
                      <input type="hidden" name="id" value={rate.id} />
                      <DeleteButton message="Delete this shipping rate?">Delete</DeleteButton>
                    </form>
                  </div>
                </div>
              );
            })}
            {rates.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No shipping rates yet. Checkout will offer free shipping.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
