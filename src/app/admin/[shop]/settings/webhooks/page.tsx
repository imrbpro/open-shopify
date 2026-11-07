import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WEBHOOK_TOPICS } from "@/lib/webhooks";
import { createWebhook, deleteWebhook, testWebhook, toggleWebhook } from "@/server/actions/settings";
import { Banner, PageHeader, SettingsTabs, StatusBadge } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WebhookSettingsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop, { owner: true });
  const [webhooks, deliveries] = await Promise.all([
    prisma.webhook.findMany({ where: { shopId: shop.id }, orderBy: { createdAt: "desc" } }),
    prisma.webhookDelivery.findMany({
      where: { webhook: { shopId: shop.id } },
      orderBy: { createdAt: "desc" },
      take: 15
    })
  ]);

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Receive real-time HTTP notifications when things happen in your store."
      />
      <SettingsTabs slug={shop.slug} active="webhooks" />

      <div className="space-y-4">
        {searchParams?.saved ? <Banner kind="success">Webhook settings updated.</Banner> : null}
        {searchParams?.error ? <Banner kind="error">{searchParams.error}</Banner> : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card card-pad">
          <h2 className="section-title">Add webhook</h2>
          <p className="mb-4 text-xs text-slate-500">
            Payloads are signed with HMAC-SHA256 using your secret.
          </p>
          <form action={createWebhook} className="space-y-3">
            <input type="hidden" name="shopSlug" value={shop.slug} />
            <div>
              <label className="label" htmlFor="hook-topic">
                Topic
              </label>
              <select id="hook-topic" name="topic" className="input" required>
                {WEBHOOK_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="hook-url">
                Delivery URL
              </label>
              <input
                id="hook-url"
                name="url"
                type="url"
                className="input"
                placeholder="https://example.com/webhooks"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="hook-secret">
                Signing secret (optional)
              </label>
              <input id="hook-secret" name="secret" className="input" placeholder="Auto-generated if blank" />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Create webhook
            </button>
          </form>
          <p className="mt-4 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-500">
            Headers include <code className="kbd">X-Open-Shopify-Topic</code> and{" "}
            <code className="kbd">X-Open-Shopify-Hmac-Sha256</code>.
          </p>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="section-title">Your webhooks</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {webhooks.map((hook) => (
              <div key={hook.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-800">{hook.topic}</span>
                    <StatusBadge status={hook.active ? "ACTIVE" : "DISABLED"} />
                  </div>
                  <p className="mt-1 break-all text-xs text-slate-500">{hook.url}</p>
                  <p className="mt-1 break-all font-mono text-[10px] text-slate-400">{hook.secret}</p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={testWebhook}>
                    <input type="hidden" name="shopSlug" value={shop.slug} />
                    <input type="hidden" name="id" value={hook.id} />
                    <button type="submit" className="btn btn-outline btn-sm">
                      Send test
                    </button>
                  </form>
                  <form action={toggleWebhook}>
                    <input type="hidden" name="shopSlug" value={shop.slug} />
                    <input type="hidden" name="id" value={hook.id} />
                    <button type="submit" className="btn btn-ghost btn-sm">
                      {hook.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deleteWebhook}>
                    <input type="hidden" name="shopSlug" value={shop.slug} />
                    <input type="hidden" name="id" value={hook.id} />
                    <DeleteButton message="Delete this webhook?">Delete</DeleteButton>
                  </form>
                </div>
              </div>
            ))}
            {webhooks.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No webhooks configured.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h2 className="section-title">Recent deliveries</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Topic</th>
              <th className="th">URL</th>
              <th className="th">Result</th>
              <th className="th text-right">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td className="td font-mono text-xs">{delivery.topic}</td>
                <td className="td max-w-[280px] truncate text-xs text-slate-500">{delivery.url}</td>
                <td className="td">
                  {delivery.error ? (
                    <span className="text-xs text-red-600">{delivery.error}</span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-700">
                      HTTP {delivery.responseCode}
                    </span>
                  )}
                </td>
                <td className="td text-right text-xs text-slate-400">{timeAgo(delivery.createdAt)}</td>
              </tr>
            ))}
            {deliveries.length === 0 ? (
              <tr>
                <td className="td text-slate-500" colSpan={4}>
                  No deliveries yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
