import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "", label: "All" },
  { key: "unfulfilled", label: "Unfulfilled" },
  { key: "unpaid", label: "Unpaid" },
  { key: "fulfilled", label: "Fulfilled" },
  { key: "refunded", label: "Refunded" },
  { key: "cancelled", label: "Cancelled" }
];

export default async function OrdersPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { status?: string; q?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const status = TABS.some((tab) => tab.key === searchParams?.status) ? searchParams!.status! : "";
  const q = searchParams?.q?.trim() ?? "";

  const where: Prisma.OrderWhereInput = { shopId: shop.id };
  if (status === "unfulfilled") {
    where.fulfillmentStatus = "UNFULFILLED";
    where.financialStatus = { not: "CANCELLED" };
  } else if (status === "unpaid") {
    where.financialStatus = "PENDING";
  } else if (status === "fulfilled") {
    where.fulfillmentStatus = "FULFILLED";
  } else if (status === "refunded") {
    where.financialStatus = { in: ["REFUNDED", "PARTIALLY_REFUNDED"] };
  } else if (status === "cancelled") {
    where.financialStatus = "CANCELLED";
  }
  if (q) {
    const ors: Prisma.OrderWhereInput[] = [
      { email: { contains: q } },
      { customer: { is: { firstName: { contains: q } } } },
      { customer: { is: { lastName: { contains: q } } } }
    ];
    const numeric = Number(q.replace(/^#/, ""));
    if (Number.isInteger(numeric)) ors.push({ number: numeric });
    where.OR = ors;
  }

  const orders = await prisma.order.findMany({
    where,
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const ordersWithTotals = await prisma.order.aggregate({
    where: { shopId: shop.id },
    _sum: { total: true },
    _count: true
  });

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${ordersWithTotals._count} orders · ${formatMoney(
          ordersWithTotals._sum.total ?? 0,
          shop.currency
        )} lifetime value`}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {TABS.map((tab) => {
            const href = `/admin/${shop.slug}/orders?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(tab.key ? { status: tab.key } : {})
            }).toString()}`;
            return (
              <Link
                key={tab.key || "all"}
                href={href}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  status === tab.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <form method="get" className="flex items-center gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Order #, email or customer"
              className="input w-64 pl-8"
            />
          </div>
          <button className="btn btn-outline" type="submit">
            Search
          </button>
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title={q || status ? "No orders match those filters" : "No orders yet"}
          description={
            q || status
              ? "Try clearing the search or switching tabs."
              : "Orders appear here as soon as customers check out of your storefront."
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="th">Order</th>
                  <th className="th">Date</th>
                  <th className="th">Customer</th>
                  <th className="th">Payment</th>
                  <th className="th">Fulfillment</th>
                  <th className="th">Items</th>
                  <th className="th text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="td">
                      <Link
                        href={`/admin/${shop.slug}/orders/${order.id}`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        #{order.number}
                      </Link>
                    </td>
                    <td className="td text-slate-500">{formatDate(order.createdAt)}</td>
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
                    <td className="td text-slate-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="td text-right font-medium">
                      {formatMoney(order.total, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
