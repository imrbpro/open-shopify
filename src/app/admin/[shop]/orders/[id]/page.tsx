import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, moneyInputValue } from "@/lib/money";
import { formatDateTime, jsonObject, timeAgo } from "@/lib/utils";
import { Banner, PageHeader, StatusBadge } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";
import {
  addOrderNote,
  cancelOrder,
  fulfillOrder,
  markOrderPaid,
  refundOrder,
  saveOrderNote
} from "@/server/actions/orders";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: { shop: string; id: string };
  searchParams?: { error?: string; saved?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const order = await prisma.order.findFirst({
    where: { id: params.id, shopId: shop.id },
    include: {
      items: true,
      customer: true,
      fulfillments: { orderBy: { createdAt: "desc" } },
      refunds: { orderBy: { createdAt: "desc" } },
      timeline: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!order) notFound();

  const address = jsonObject<Record<string, string>>(order.shippingAddressJson, {});
  const refunded = order.refunds.reduce((sum, refund) => sum + refund.amount, 0);
  const remaining = order.total - refunded;
  const canRefund = remaining > 0 && !["CANCELLED", "PENDING"].includes(order.financialStatus);
  const canCancel = order.fulfillmentStatus !== "FULFILLED" && order.financialStatus !== "CANCELLED";
  const canFulfill =
    order.fulfillmentStatus !== "FULFILLED" && order.financialStatus !== "CANCELLED";
  const base = `/admin/${shop.slug}`;

  return (
    <div>
      <PageHeader
        title={`Order #${order.number}`}
        subtitle={`Placed ${formatDateTime(order.createdAt)} · ${order.email}`}
        actions={
          <>
            <Link href={`${base}/orders/${order.id}/packing-slip`} className="btn btn-outline">
              <Icon name="page" className="h-4 w-4" />
              Packing slip
            </Link>
            <Link href={`${base}/orders`} className="btn btn-ghost">
              All orders
            </Link>
          </>
        }
      />

      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      {searchParams?.saved ? (
        <div className="mb-4">
          <Banner kind="success">Order note saved.</Banner>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.financialStatus} />
        <StatusBadge status={order.fulfillmentStatus} />
        {order.discountCode ? (
          <span className="badge border border-purple-200 bg-purple-50 text-purple-700">
            <Icon name="discount" className="h-3 w-3" /> {order.discountCode}
          </span>
        ) : null}
        {refunded > 0 ? (
          <span className="text-xs text-slate-500">
            {formatMoney(refunded, order.currency)} refunded
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3.5">
              <h2 className="section-title">Line items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Item</th>
                    <th className="th text-right">Price</th>
                    <th className="th text-center">Qty</th>
                    <th className="th text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image ?? "/images/placeholder.svg"}
                            alt=""
                            className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                          />
                          <div>
                            <p className="font-medium text-slate-800">{item.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {item.variantTitle ? `${item.variantTitle} · ` : ""}
                              {item.sku ?? "No SKU"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="td text-right">{formatMoney(item.price, order.currency)}</td>
                      <td className="td text-center">{item.quantity}</td>
                      <td className="td text-right font-medium">
                        {formatMoney(item.total, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-4">
              <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd>{formatMoney(order.subtotal, order.currency)}</dd>
                </div>
                {order.discountTotal > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Discount {order.discountCode ? `(${order.discountCode})` : ""}</dt>
                    <dd>−{formatMoney(order.discountTotal, order.currency)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Shipping</dt>
                  <dd>{formatMoney(order.shippingTotal, order.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tax</dt>
                  <dd>{formatMoney(order.taxTotal, order.currency)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatMoney(order.total, order.currency)}</dd>
                </div>
                {refunded > 0 ? (
                  <>
                    <div className="flex justify-between text-red-600">
                      <dt>Refunded</dt>
                      <dd>−{formatMoney(refunded, order.currency)}</dd>
                    </div>
                    <div className="flex justify-between font-medium">
                      <dt>Net</dt>
                      <dd>{formatMoney(Math.max(0, remaining), order.currency)}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="section-title">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {order.timeline.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm text-slate-700">{event.message}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(event.createdAt)} · {timeAgo(event.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <form action={addOrderNote} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <input type="hidden" name="shopSlug" value={shop.slug} />
              <input type="hidden" name="id" value={order.id} />
              <input
                name="message"
                className="input"
                placeholder="Add an internal timeline note…"
                required
              />
              <button className="btn btn-outline shrink-0" type="submit">
                Add
              </button>
            </form>
          </div>

          <div className="card card-pad">
            <h2 className="section-title">Internal note</h2>
            <form action={saveOrderNote} className="mt-3">
              <input type="hidden" name="shopSlug" value={shop.slug} />
              <input type="hidden" name="id" value={order.id} />
              <textarea
                name="note"
                className="input min-h-[90px]"
                defaultValue={order.note ?? ""}
                placeholder="Delivery instructions, customer context, etc."
              />
              <button className="btn btn-outline mt-2" type="submit">
                Save note
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card card-pad">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Customer</h2>
              {order.customer ? (
                <Link href={`${base}/customers/${order.customer.id}`} className="admin-link text-xs">
                  Profile
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {order.customer
                ? `${order.customer.firstName} ${order.customer.lastName}`.trim() || order.email
                : "Guest checkout"}
            </p>
            <p className="text-xs text-slate-500">{order.email}</p>
            {order.customer?.phone ? (
              <p className="text-xs text-slate-500">{order.customer.phone}</p>
            ) : null}
            {order.customer ? (
              <p className="mt-2 text-[11px] text-slate-400">
                {order.customer.ordersCount} orders · {formatMoney(order.customer.totalSpent, order.currency)} spent
              </p>
            ) : null}
          </div>

          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-slate-900">Shipping address</h2>
            <address className="mt-2 space-y-0.5 text-sm not-italic text-slate-600">
              <p className="font-medium text-slate-800">{address.name || "—"}</p>
              {address.company ? <p>{address.company}</p> : null}
              {address.line1 ? <p>{address.line1}</p> : null}
              {address.line2 ? <p>{address.line2}</p> : null}
              <p>
                {[address.city, address.province, address.zip].filter(Boolean).join(", ") || "—"}
              </p>
              <p>{address.country || ""}</p>
              {address.phone ? <p>{address.phone}</p> : null}
            </address>
            <p className="mt-2 text-[11px] text-slate-400">
              {order.shippingMethod ?? "No shipping method"}
            </p>
          </div>

          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-slate-900">Payment</h2>
            <div className="mt-2 space-y-1.5 text-sm text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={order.financialStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span>{order.paymentMethod ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-medium">{formatMoney(order.total, order.currency)}</span>
              </div>
            </div>
            {order.financialStatus === "PENDING" ? (
              <form action={markOrderPaid} className="mt-3">
                <input type="hidden" name="shopSlug" value={shop.slug} />
                <input type="hidden" name="id" value={order.id} />
                <button className="btn btn-primary w-full" type="submit">
                  Mark as paid
                </button>
              </form>
            ) : null}
          </div>

          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-slate-900">Fulfillment</h2>
            {order.fulfillments.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {order.fulfillments.map((fulfillment) => (
                  <li key={fulfillment.id} className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      {fulfillment.trackingCompany ?? "Carrier"} · {fulfillment.trackingNumber ?? "No tracking"}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(fulfillment.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {canFulfill ? (
              <form action={fulfillOrder} className="mt-3 space-y-2">
                <input type="hidden" name="shopSlug" value={shop.slug} />
                <input type="hidden" name="id" value={order.id} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Carrier</label>
                    <select name="trackingCompany" className="input" defaultValue="UPS">
                      <option>UPS</option>
                      <option>USPS</option>
                      <option>FedEx</option>
                      <option>DHL</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Tracking</label>
                    <input name="trackingNumber" className="input" placeholder="1Z…" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" name="notify" defaultChecked className="h-3.5 w-3.5" />
                  Email the customer a shipping update
                </label>
                <button className="btn btn-dark w-full" type="submit">
                  Mark as fulfilled
                </button>
              </form>
            ) : null}
          </div>

          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-slate-900">Refunds</h2>
            {order.refunds.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {order.refunds.map((refund) => (
                  <li key={refund.id} className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      {formatMoney(refund.amount, order.currency)} · {refund.reason ?? "Refund"}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(refund.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {canRefund ? (
              <form action={refundOrder} className="mt-3 space-y-2">
                <input type="hidden" name="shopSlug" value={shop.slug} />
                <input type="hidden" name="id" value={order.id} />
                <div>
                  <label className="label">Amount</label>
                  <input
                    name="amount"
                    className="input"
                    defaultValue={moneyInputValue(remaining)}
                    inputMode="decimal"
                    required
                  />
                </div>
                <div>
                  <label className="label">Reason</label>
                  <select name="reason" className="input" defaultValue="Customer request">
                    <option>Customer request</option>
                    <option>Damaged item</option>
                    <option>Wrong item</option>
                    <option>Goodwill adjustment</option>
                    <option>Other</option>
                  </select>
                </div>
                <input name="note" className="input" placeholder="Optional note" />
                <button className="btn btn-outline w-full" type="submit">
                  Issue refund
                </button>
              </form>
            ) : null}
          </div>

          {canCancel ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h2 className="text-sm font-semibold text-red-800">Cancel order</h2>
              <p className="mt-1 text-xs text-red-700">
                Cancelling restocks inventory and marks the order cancelled.
              </p>
              <form action={cancelOrder} className="mt-2">
                <input type="hidden" name="shopSlug" value={shop.slug} />
                <input type="hidden" name="id" value={order.id} />
                <DeleteButton message={`Cancel order #${order.number}?`}>Cancel order</DeleteButton>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
