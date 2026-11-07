import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, formatDate, startOfDay, timeAgo } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { getShopSettings } from "@/lib/settings";
import { Banner, StatusBadge, StatCard, RevenueChart, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { created?: string };
}) {
  const { shop, membership } = await requireShop(params.shop);
  const settings = await getShopSettings(shop.id);
  const now = new Date();
  const since = addDays(now, -30);

  const [orders, productCount, customerCount, lowStock, installedApps, productViews, checkouts, refundAgg] =
    await Promise.all([
      prisma.order.findMany({
        where: { shopId: shop.id, createdAt: { gte: since } },
        include: { items: true, customer: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.product.count({ where: { shopId: shop.id } }),
      prisma.customer.count({ where: { shopId: shop.id } }),
      prisma.productVariant.findMany({
        where: {
          product: { shopId: shop.id },
          trackInventory: true,
          inventoryQty: { lte: settings.lowStockThreshold }
        },
        include: { product: true },
        orderBy: { inventoryQty: "asc" },
        take: 6
      }),
      prisma.appInstallation.findMany({
        where: { shopId: shop.id },
        include: { app: true },
        orderBy: { installedAt: "desc" }
      }),
      prisma.event.count({ where: { shopId: shop.id, name: "product_viewed", createdAt: { gte: since } } }),
      prisma.event.count({ where: { shopId: shop.id, name: "checkout_started", createdAt: { gte: since } } }),
      prisma.refund.aggregate({
        where: { order: { shopId: shop.id, createdAt: { gte: since } } },
        _sum: { amount: true }
      })
    ]);

  const paidOrders = orders.filter(
    (order) => order.financialStatus === "PAID" || order.financialStatus === "PARTIALLY_REFUNDED"
  );
  const grossSales = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const netSales = Math.max(0, grossSales - (refundAgg._sum.amount ?? 0));
  const aov = paidOrders.length ? Math.round(netSales / paidOrders.length) : 0;
  const conversion = checkouts > 0 ? Math.round((paidOrders.length / checkouts) * 1000) / 10 : 0;

  const daily = new Map<string, number>();
  for (let i = 13; i >= 0; i--) daily.set(dayKey(addDays(now, -i)), 0);
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
  const bestSellers = Array.from(topProducts.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const setupSteps = [
    {
      done: productCount > 0,
      label: "Add your first product",
      href: `/admin/${shop.slug}/products/new`
    },
    {
      done: orders.length > 0,
      label: "Share your store to get an order",
      href: `/s/${shop.slug}`,
      external: true
    },
    {
      done: installedApps.length > 0,
      label: "Install an app from the app store",
      href: `/admin/${shop.slug}/apps`
    },
    {
      done: membership.role !== "OWNER" || shop.subscription?.status === "ACTIVE",
      label: "Review your plan and trial",
      href: `/admin/${shop.slug}/billing`
    }
  ];
  const remainingSteps = setupSteps.filter((step) => !step.done);

  return (
    <div className="space-y-6">
      {searchParams?.created ? (
        <Banner kind="success">
          <span className="font-semibold">Your store is live.</span> Add a product, customize your
          theme, or open the storefront to see it in action.
        </Banner>
      ) : null}

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
          {membership.role === "OWNER" ? "owner" : "team"}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Here&apos;s what happened at {shop.name} in the last 30 days.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net sales"
          value={formatMoney(netSales, shop.currency)}
          hint={`${formatMoney(refundAgg._sum.amount ?? 0, shop.currency)} refunded`}
          icon={<Icon name="chart" />}
        />
        <StatCard
          label="Orders"
          value={String(paidOrders.length)}
          hint={`${orders.length} orders created`}
          icon={<Icon name="orders" />}
        />
        <StatCard
          label="Average order"
          value={formatMoney(aov, shop.currency)}
          hint="Net sales ÷ paid orders"
          icon={<Icon name="billing" />}
        />
        <StatCard
          label="Conversion"
          value={`${conversion}%`}
          hint={`${productViews} product views · ${checkouts} checkouts`}
          icon={<Icon name="sparkle" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card card-pad lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Sales over time</h2>
              <p className="text-xs text-slate-500">Paid order value, last 14 days</p>
            </div>
            <Link href={`/admin/${shop.slug}/analytics`} className="admin-link">
              View analytics
            </Link>
          </div>
          <RevenueChart data={chartData} currency={shop.currency} />
        </div>

        <div className="card card-pad">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Setup guide</h2>
            {remainingSteps.length === 0 ? <StatusBadge status="ACTIVE" /> : null}
          </div>
          <p className="mb-3 text-xs text-slate-500">
            {remainingSteps.length === 0
              ? "Your store is ready to sell."
              : `${setupSteps.length - remainingSteps.length} of ${setupSteps.length} steps complete`}
          </p>
          <ul className="space-y-1.5">
            {setupSteps.map((step) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  target={step.external ? "_blank" : undefined}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      step.done
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    <Icon name="check" className="h-3 w-3" />
                  </span>
                  <span className={step.done ? "text-slate-400 line-through" : "text-slate-700"}>
                    {step.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="section-title">Recent orders</h2>
            <Link href={`/admin/${shop.slug}/orders`} className="admin-link">
              All orders
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No orders yet"
                description="Share your storefront to get your first order. Paid orders and their status will appear here."
                action={
                  <Link href={`/s/${shop.slug}`} target="_blank" className="btn btn-primary">
                    Open storefront
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Order</th>
                    <th className="th">Customer</th>
                    <th className="th">Payment</th>
                    <th className="th">Fulfillment</th>
                    <th className="th text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 7).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="td">
                        <Link
                          href={`/admin/${shop.slug}/orders/${order.id}`}
                          className="font-semibold text-emerald-700 hover:underline"
                        >
                          #{order.number}
                        </Link>
                        <p className="text-[11px] text-slate-400">{timeAgo(order.createdAt)}</p>
                      </td>
                      <td className="td">
                        <p className="font-medium text-slate-800">
                          {order.customer
                            ? `${order.customer.firstName} ${order.customer.lastName}`.trim() || order.email
                            : order.email}
                        </p>
                        <p className="text-[11px] text-slate-400">{order.email}</p>
                      </td>
                      <td className="td">
                        <StatusBadge status={order.financialStatus} />
                      </td>
                      <td className="td">
                        <StatusBadge status={order.fulfillmentStatus} />
                      </td>
                      <td className="td text-right font-medium">
                        {formatMoney(order.total, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card card-pad">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Top products</h2>
              <Link href={`/admin/${shop.slug}/products`} className="text-xs text-slate-500 hover:text-slate-800">
                Manage
              </Link>
            </div>
            {bestSellers.length === 0 ? (
              <p className="text-sm text-slate-500">No sales in this period.</p>
            ) : (
              <ul className="space-y-2.5">
                {bestSellers.map((product) => (
                  <li key={product.title} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{product.title}</p>
                      <p className="text-[11px] text-slate-400">{product.quantity} sold</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-600">
                      {formatMoney(product.revenue, shop.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card card-pad">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Low stock</h2>
              <Link href={`/admin/${shop.slug}/products`} className="text-xs text-slate-500 hover:text-slate-800">
                Inventory
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-500">All tracked variants are above the threshold.</p>
            ) : (
              <ul className="space-y-2.5">
                {lowStock.map((variant) => (
                  <li key={variant.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{variant.product.title}</p>
                      <p className="text-[11px] text-slate-400">{variant.title}</p>
                    </div>
                    <span
                      className={`badge ${
                        variant.inventoryQty === 0
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {variant.inventoryQty === 0 ? "Sold out" : `${variant.inventoryQty} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card card-pad">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Installed apps</h2>
              <Link href={`/admin/${shop.slug}/apps`} className="text-xs text-slate-500 hover:text-slate-800">
                App store
              </Link>
            </div>
            {installedApps.length === 0 ? (
              <p className="text-sm text-slate-500">No apps installed yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {installedApps.slice(0, 4).map((installation) => (
                  <li key={installation.id} className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                      style={{ background: installation.app.color }}
                    >
                      {installation.app.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{installation.app.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Installed {formatDate(installation.installedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
