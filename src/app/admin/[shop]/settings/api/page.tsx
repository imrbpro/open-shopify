import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createApiKey, revokeApiKey } from "@/server/actions/settings";
import { Banner, PageHeader, SettingsTabs } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { formatDate, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ApiSettingsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop, { owner: true });
  const keys = await prisma.apiKey.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <PageHeader title="API keys" subtitle="Use the Admin API to build custom integrations." />
      <SettingsTabs slug={shop.slug} active="api" />

      <div className="space-y-4">
        {searchParams?.saved ? <Banner kind="success">API settings updated.</Banner> : null}
        {searchParams?.error ? <Banner kind="error">{searchParams.error}</Banner> : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card card-pad">
          <h2 className="section-title">Create a key</h2>
          <p className="mb-4 text-xs text-slate-500">
            Keys grant access to products, orders and shop data. Treat them like passwords.
          </p>
          <form action={createApiKey} className="space-y-3">
            <input type="hidden" name="shopSlug" value={shop.slug} />
            <div>
              <label className="label" htmlFor="key-label">
                Label
              </label>
              <input id="key-label" name="label" className="input" placeholder="Warehouse sync" required />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Generate key
            </button>
          </form>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Scopes</p>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-500">
              read_products, write_products, read_orders
            </p>
          </div>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="section-title">Active keys</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {keys.map((key) => (
              <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{key.label}</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{key.token}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Created {formatDate(key.createdAt)}
                    {key.lastUsedAt ? ` · last used ${timeAgo(key.lastUsedAt)}` : " · never used"}
                  </p>
                </div>
                <form action={revokeApiKey}>
                  <input type="hidden" name="shopSlug" value={shop.slug} />
                  <input type="hidden" name="id" value={key.id} />
                  <DeleteButton message="Revoke this API key? Integrations using it will stop working.">
                    Revoke
                  </DeleteButton>
                </form>
              </div>
            ))}
            {keys.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No API keys yet.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="card card-pad mt-4">
        <h2 className="section-title">Admin API quickstart</h2>
        <p className="mt-1 text-sm text-slate-600">
          Send your key in the <code className="kbd">X-Open-Shopify-Access-Token</code> header.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-200">
{`# List products
curl "http://localhost:3000/api/v1/products?limit=5" \\
  -H "X-Open-Shopify-Access-Token: <your-key>"

# Create a product
curl -X POST "http://localhost:3000/api/v1/products" \\
  -H "X-Open-Shopify-Access-Token: <your-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"New product","variants":[{"title":"Default","price":1900,"inventoryQty":10}]}'

# List orders
curl "http://localhost:3000/api/v1/orders?status=paid" \\
  -H "X-Open-Shopify-Access-Token: <your-key>"`}
        </pre>
      </div>
    </div>
  );
}
