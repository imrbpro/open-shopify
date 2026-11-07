import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getShopSettings } from "@/lib/settings";
import { updateNotificationSettings } from "@/server/actions/settings";
import { Banner, PageHeader, SettingsTabs, StatusBadge } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PLACEHOLDERS = ["{{customer_name}}", "{{order_number}}", "{{total}}", "{{shop_name}}", "{{tracking_number}}", "{{tracking_company}}"];

export default async function NotificationSettingsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop, { owner: true });
  const [settings, emails] = await Promise.all([
    getShopSettings(shop.id),
    prisma.emailMessage.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`Customer emails sent by your store via ${settings.emailProvider}.`}
      />
      <SettingsTabs slug={shop.slug} active="notifications" />

      <div className="space-y-4">
        {searchParams?.saved ? <Banner kind="success">Notification templates saved.</Banner> : null}
        {searchParams?.error ? <Banner kind="error">{searchParams.error}</Banner> : null}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Available placeholders:</span>{" "}
        {PLACEHOLDERS.map((token) => (
          <code key={token} className="kbd mr-1">
            {token}
          </code>
        ))}
      </div>

      <form action={updateNotificationSettings} className="mt-4 space-y-4">
        <input type="hidden" name="shopSlug" value={shop.slug} />

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Order confirmation</h2>
            <p className="text-xs text-slate-500">Sent immediately after a successful checkout.</p>
          </div>
          <div>
            <label className="label" htmlFor="orderConfirmationSubject">
              Subject
            </label>
            <input
              id="orderConfirmationSubject"
              name="orderConfirmationSubject"
              className="input"
              defaultValue={settings.orderConfirmationSubject}
            />
          </div>
          <div>
            <label className="label" htmlFor="orderConfirmationBody">
              Body
            </label>
            <textarea
              id="orderConfirmationBody"
              name="orderConfirmationBody"
              rows={7}
              className="input font-mono !text-xs"
              defaultValue={settings.orderConfirmationBody}
            />
          </div>
        </div>

        <div className="card card-pad space-y-4">
          <div>
            <h2 className="section-title">Shipping confirmation</h2>
            <p className="text-xs text-slate-500">Sent when an order is marked as fulfilled.</p>
          </div>
          <div>
            <label className="label" htmlFor="shippingEmailSubject">
              Subject
            </label>
            <input
              id="shippingEmailSubject"
              name="shippingEmailSubject"
              className="input"
              defaultValue={settings.shippingEmailSubject}
            />
          </div>
          <div>
            <label className="label" htmlFor="shippingEmailBody">
              Body
            </label>
            <textarea
              id="shippingEmailBody"
              name="shippingEmailBody"
              rows={7}
              className="input font-mono !text-xs"
              defaultValue={settings.shippingEmailBody}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Save templates
          </button>
        </div>
      </form>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h2 className="section-title">Delivery log</h2>
          <p className="text-xs text-slate-500">
            Every email is recorded here with its provider and delivery status. Configure delivery in
            Settings → Integrations.
          </p>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Recipient</th>
              <th className="th">Subject</th>
              <th className="th">Type</th>
              <th className="th">Status</th>
              <th className="th text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {emails.map((email) => (
              <tr key={email.id}>
                <td className="td">{email.to}</td>
                <td className="td">
                  <details>
                    <summary className="cursor-pointer font-medium text-slate-800">{email.subject}</summary>
                    <pre className="mt-2 max-w-xl whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-600">
                      {email.body}
                    </pre>
                  </details>
                </td>
                <td className="td text-xs text-slate-500">{email.kind.replaceAll("_", " ")}</td>
                <td className="td">
                  <StatusBadge status={email.status} />
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                    {email.provider}
                  </p>
                  {email.error ? (
                    <p className="mt-1 max-w-[200px] text-[10px] leading-relaxed text-red-600">
                      {email.error}
                    </p>
                  ) : null}
                </td>
                <td className="td text-right text-xs text-slate-500">{timeAgo(email.createdAt)}</td>
              </tr>
            ))}
            {emails.length === 0 ? (
              <tr>
                <td className="td text-slate-500" colSpan={5}>
                  No emails sent yet. Place a test order from the storefront.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
