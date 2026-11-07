import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatBps, planFeatures } from "@/lib/plans";
import { formatMoney, formatMoneyExact } from "@/lib/money";
import { daysBetween, formatDate } from "@/lib/utils";
import { cancelSubscription, changePlan, resumeSubscription } from "@/server/actions/billing";
import { Banner, PageHeader, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop, membership } = await requireShop(params.shop);
  const isOwner = membership.role === "OWNER";
  const subscription = shop.subscription;

  const [plans, productCount, staffCount, appCount, invoices] = await Promise.all([
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.count({ where: { shopId: shop.id } }),
    prisma.membership.count({ where: { shopId: shop.id } }),
    prisma.appInstallation.count({ where: { shopId: shop.id, status: "ACTIVE" } }),
    subscription
      ? prisma.invoice.findMany({
          where: { subscriptionId: subscription.id },
          orderBy: { createdAt: "desc" }
        })
      : Promise.resolve([])
  ]);

  const currentPlan = subscription?.plan;
  const trialDaysLeft =
    subscription?.status === "TRIALING" && subscription.trialEndsAt
      ? daysBetween(new Date(), subscription.trialEndsAt)
      : null;

  return (
    <div>
      <PageHeader
        title="Plan & billing"
        subtitle="Manage your subscription, usage and invoices."
        actions={<StatusBadge status={subscription?.status ?? "NONE"} />}
      />

      <div className="space-y-4">
        {searchParams?.saved ? <Banner kind="success">Billing updated.</Banner> : null}
        {searchParams?.error ? <Banner kind="error">{searchParams.error}</Banner> : null}
        {!isOwner ? (
          <Banner kind="info">
            Only the store owner can change plans. You can review usage and invoices below.
          </Banner>
        ) : null}
        {subscription?.status === "CANCELLED" ? (
          <Banner kind="error">
            Your subscription is cancelled. The storefront is offline and checkout is disabled until
            you reactivate a plan.
          </Banner>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card card-pad">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{currentPlan?.name ?? "None"}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <Icon name="billing" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {currentPlan ? formatMoneyExact(currentPlan.priceMonthly, shop.currency) : "—"}
            <span className="text-slate-400">/month</span>
          </p>
          {trialDaysLeft !== null ? (
            <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
              Trial ends in {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"}
              {subscription?.trialEndsAt ? ` · ${formatDate(subscription.trialEndsAt)}` : ""}
            </p>
          ) : subscription ? (
            <p className="mt-2 text-xs text-slate-500">
              Renews {formatDate(subscription.currentPeriodEnd)}
            </p>
          ) : null}
          {currentPlan ? (
            <ul className="mt-4 space-y-1.5">
              {planFeatures(currentPlan)
                .slice(0, 4)
                .map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-slate-600">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Usage</h2>
          <p className="mb-4 text-xs text-slate-500">Limits reset when you change plans.</p>
          <div className="space-y-4">
            <UsageBar
              label="Products"
              count={productCount}
              limit={currentPlan?.productLimit ?? null}
            />
            <UsageBar label="Staff accounts" count={staffCount} limit={currentPlan?.staffLimit ?? null} />
            <UsageBar label="Apps installed" count={appCount} limit={null} />
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500">
            Third-party transaction fee:{" "}
            <span className="font-semibold text-slate-700">
              {currentPlan ? formatBps(currentPlan.transactionFeeBps) : "—"}
            </span>
            . Card rate:{" "}
            <span className="font-semibold text-slate-700">
              {currentPlan ? `${formatBps(currentPlan.cardRateBps)} + ${formatMoneyExact(currentPlan.cardFixedCents, shop.currency)}` : "—"}
            </span>
            .
          </p>
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Payment method</h2>
          <div className="mt-3 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <Icon name="credit" className="h-6 w-6" />
              <span className="text-xs font-semibold tracking-widest">VISA</span>
            </div>
            <p className="mt-6 font-mono text-lg tracking-widest">•••• •••• •••• 4242</p>
            <p className="mt-1 text-[11px] text-slate-400">Expires 04/29 · Simulated card</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {isOwner && subscription?.status !== "CANCELLED" ? (
              <form action={cancelSubscription}>
                <input type="hidden" name="shopSlug" value={shop.slug} />
                <button type="submit" className="btn btn-outline btn-sm">
                  Cancel subscription
                </button>
              </form>
            ) : null}
            {isOwner && subscription?.status === "CANCELLED" ? (
              <form action={resumeSubscription}>
                <input type="hidden" name="shopSlug" value={shop.slug} />
                <button type="submit" className="btn btn-primary btn-sm">
                  Reactivate subscription
                </button>
              </form>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Payments are simulated in this reverse-engineered build. Cancelling freezes the storefront
            and checkout immediately.
          </p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight text-slate-900">Plans</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan?.id;
          return (
            <div
              key={plan.id}
              className={`card relative overflow-hidden ${
                isCurrent ? "ring-2 ring-emerald-600" : ""
              }`}
            >
              {isCurrent ? (
                <span className="absolute right-0 top-0 rounded-bl-lg bg-emerald-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Current
                </span>
              ) : null}
              <div className="card-pad">
                <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-0.5 min-h-[36px] text-xs text-slate-500">{plan.description}</p>
                <p className="mt-3">
                  <span className="text-2xl font-semibold tracking-tight text-slate-900">
                    {formatMoney(plan.priceMonthly, shop.currency)}
                  </span>
                  <span className="text-sm text-slate-400">/month</span>
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {plan.productLimit === null ? "Unlimited products" : `${plan.productLimit} products`}
                  {" · "}
                  {plan.staffLimit === null ? "Unlimited staff" : `${plan.staffLimit} staff`}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {planFeatures(plan).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-slate-600">
                      <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {isCurrent ? (
                    <button type="button" disabled className="btn btn-outline w-full">
                      Current plan
                    </button>
                  ) : isOwner ? (
                    <form action={changePlan}>
                      <input type="hidden" name="shopSlug" value={shop.slug} />
                      <input type="hidden" name="planCode" value={plan.code} />
                      <button type="submit" className="btn btn-primary w-full">
                        Switch to {plan.name}
                      </button>
                    </form>
                  ) : (
                    <button type="button" disabled className="btn btn-outline w-full">
                      Owner only
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h2 className="section-title">Invoices</h2>
          <p className="text-xs text-slate-500">Billing history for this store.</p>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Invoice</th>
              <th className="th">Period</th>
              <th className="th">Status</th>
              <th className="th text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="td font-mono text-xs font-medium text-slate-800">{invoice.number}</td>
                <td className="td text-xs text-slate-500">
                  {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                </td>
                <td className="td">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="td text-right font-medium">
                  {formatMoneyExact(invoice.amount, shop.currency)}
                </td>
              </tr>
            ))}
            {invoices.length === 0 ? (
              <tr>
                <td className="td text-slate-500" colSpan={4}>
                  No invoices yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsageBar({ label, count, limit }: { label: string; count: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((count / Math.max(1, limit)) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">
          {count} {limit === null ? "/ ∞" : `/ ${limit}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${limit === null ? 8 : Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  );
}
