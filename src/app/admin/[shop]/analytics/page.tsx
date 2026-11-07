import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, formatDate, startOfDay, timeAgo } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { RevenueChart, StatCard } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90];

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { range?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const range = RANGES.includes(Number(searchParams?.range)) ? Number(searchParams?.range) : 30;
  const now = new Date();
  const since = startOfDay(addDays(now, -(range - 1)));

  const [orders, refundAgg, views, checkouts, newCustomers, eventGroups, recentEvents, productViewsRaw, products] =
    await Promise.all([
      prisma.order.findMany({
        where: { shopId: shop.id, createdAt: { gte: since } },
        include: { items: true }
      }),
      prisma.refund.aggregate({
        where: { order: { shopId: shop.id, createdAt: { gte: since } } },
        _sum: { amount: true }
      }),
      prisma.event.count({ where: { shopId: shop.id, name: "product_viewed", createdAt: { gte: since } } }),
      prisma.event.count({ where: { shopId: shop.id, name: "checkout_started", createdAt: { gte: since } } }),
      prisma.customer.count({ where: { shopId: shop.id, createdAt: { gte: since } } }),
      prisma.event.groupBy({
        by: ["name"],
        where: { shopId: shop.id, createdAt: { gte: since } },
        _count: { _all: true }
      }),
      prisma.event.findMany({
        where: { shopId: shop.id },
        orderBy: { createdAt: "desc" },
        take: 12
      }),
      prisma.event.findMany({
        where: { shopId: shop.id, name: "product_viewed", createdAt: { gte: since } },
        select: { dataJson: true }
      }),
      prisma.product.findMany({ where: { shopId: shop.id }, select: { handle: true, title: true } })
    ]);

  const paidOrders = orders.filter(
    (order) => order.financialStatus === "PAID" || order.financialStatus === "PARTIALLY_REFUNDED"
  );
  const gross = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const netSales = Math.max(0, gross - (refundAgg._sum.amount ?? 0));
  const aov = paidOrders.length ? Math.round(netSales / paidOrders.length) : 0;
  const conversion = checkouts > 0 ? Math.round((paidOrders.length / checkouts) * 1000) / 10 : 0;

  const daily = new Map<string, number>();
  for (let i = range - 1; i >= 0; i--) daily.set(dayKey(addDays(now, -i)), 0);
  for (const order of paidOrders) {
    const key = dayKey(order.createdAt);
    if (daily.has(key)) daily.set(key, (daily.get(key) ?? 0) + order.total);
  }
  const chartData = Array.from(daily.entries()).map(([key, value]) => ({
    label: formatDate(new Date(`${key}T00:00:00`), { month: "short", day: "numeric" }),
    value,
    display: formatMoney(value, shop.currency)
  }));

  const topProducts = new Map<string, { title: string; quantity: number; revenue: number }>();
  for (const order of paidOrders) {
    for (const item of order.items) {
      const key = item.productId ?? item.title;
      const current = topProducts.get(key) ?? { title: item.title, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.total;
      topProducts.set(key, current);
    }
  }
  const bestSellers = Array.from(topProducts.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const titleByHandle = new Map(products.map((product) => [product.handle, product.title]));
  const viewCounts = new Map<string, number>();
  for (const event of productViewsRaw) {
    try {
      const data = JSON.parse(event.dataJson) as { handle?: string };
      if (data.handle) viewCounts.set(data.handle, (viewCounts.get(data.handle) ?? 0) + 1);
    } catch {
      // ignore malformed event payloads
    }
  }
  const mostViewed = Array.from(viewCounts.entries())
    .map(([handle, count]) => ({ handle, title: titleByHandle.get(handle) ?? handle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const funnelMax = Math.max(views, checkouts, paidOrders.length, 1);
  const funnel = [
    { label: "Product views", value: views, color: "bg-sky-500" },
    { label: "Checkouts started", value: checkouts, color: "bg-violet-500" },
    { label: "Paid orders", value: paidOrders.length, color: "bg-emerald-500" }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Sales, conversion and traffic signals for {shop.name}.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {RANGES.map((days) => (
            <Link
              key={days}
              href={`/admin/${shop.slug}/analytics?range=${days}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                range === days ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {days} days
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net sales"
          value={formatMoney(netSales, shop.currency)}
          hint={`${formatMoney(refundAgg._sum.amount ?? 0, shop.currency)} refunded`}
          icon={<Icon name="chart" />}
        />
        <StatCard
          label="Paid orders"
          value={String(paidOrders.length)}
          hint={`${orders.length} total orders in range`}
          icon={<Icon name="orders" />}
        />
        <StatCard label="Avg. order value" value={formatMoney(aov, shop.currency)} icon={<Icon name="credit" />} />
        <StatCard
          label="Conversion"
          value={`${conversion}%`}
          hint="Paid orders ÷ checkouts started"
          icon={<Icon name="sparkle" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card card-pad lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Sales over time</h2>
              <p className="text-xs text-slate-500">Paid order value, last {range} days</p>
            </div>
            <span className="text-xs text-slate-400">{newCustomers} new customers</span>
          </div>
          <RevenueChart data={chartData} currency={shop.currency} />
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Conversion funnel</h2>
          <p className="mb-4 text-xs text-slate-500">Storefront events in this period</p>
          <div className="space-y-4">
            {funnel.map((step) => (
              <div key={step.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{step.label}</span>
                  <span className="font-medium text-slate-900">{step.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${step.color}`}
                    style={{ width: `${Math.max(2, Math.round((step.value / funnelMax) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
            Product views and checkout starts are captured as platform events. Conversion is paid
            orders divided by checkouts started.
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="section-title">Top products by revenue</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Product</th>
                <th className="th text-center">Units</th>
                <th className="th text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bestSellers.map((product) => (
                <tr key={product.title}>
                  <td className="td font-medium text-slate-800">{product.title}</td>
                  <td className="td text-center text-slate-500">{product.quantity}</td>
                  <td className="td text-right">{formatMoney(product.revenue, shop.currency)}</td>
                </tr>
              ))}
              {bestSellers.length === 0 ? (
                <tr>
                  <td className="td text-slate-500" colSpan={3}>
                    No paid orders in this range.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="section-title">Most viewed products</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Product</th>
                <th className="th text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mostViewed.map((product) => (
                <tr key={product.handle}>
                  <td className="td font-medium text-slate-800">{product.title}</td>
                  <td className="td text-right text-slate-500">{product.count}</td>
                </tr>
              ))}
              {mostViewed.length === 0 ? (
                <tr>
                  <td className="td text-slate-500" colSpan={2}>
                    No product views tracked yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="section-title">Events</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Event</th>
                <th className="th text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eventGroups
                .sort((a, b) => b._count._all - a._count._all)
                .map((group) => (
                  <tr key={group.name}>
                    <td className="td font-mono text-xs text-slate-700">{group.name}</td>
                    <td className="td text-right">{group._count._all}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Recent activity</h2>
          <ul className="mt-3 space-y-2.5">
            {recentEvents.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-mono text-xs text-slate-600">{event.name}</span>
                <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(event.createdAt)}</span>
              </li>
            ))}
            {recentEvents.length === 0 ? (
              <li className="text-sm text-slate-500">No events tracked yet.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
