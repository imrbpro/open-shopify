import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, jsonObject } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function PackingSlipPage({
  params
}: {
  params: { shop: string; id: string };
}) {
  const { shop } = await requireShop(params.shop);
  const order = await prisma.order.findFirst({
    where: { id: params.id, shopId: shop.id },
    include: { items: true, customer: true }
  });
  if (!order) notFound();
  const address = jsonObject<Record<string, string>>(order.shippingAddressJson, {});

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={`/admin/${shop.slug}/orders/${order.id}`} className="btn btn-ghost">
          ← Back to order
        </Link>
        <PrintButton label="Print packing slip" />
      </div>

      <div className="print-sheet mx-auto max-w-[820px] rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-slate-200 pb-5">
          <div>
            <Logo />
            <p className="mt-2 text-sm font-medium text-slate-800">{shop.name}</p>
            <p className="text-xs text-slate-500">{shop.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Packing slip</p>
            <p className="text-lg font-semibold text-slate-900">Order #{order.number}</p>
            <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ship to</p>
            <address className="mt-1.5 space-y-0.5 text-sm not-italic text-slate-700">
              <p className="font-medium">{order.customer ? `${order.customer.firstName} ${order.customer.lastName}`.trim() : address.name}</p>
              {address.company ? <p>{address.company}</p> : null}
              {address.line1 ? <p>{address.line1}</p> : null}
              {address.line2 ? <p>{address.line2}</p> : null}
              <p>{[address.city, address.province, address.zip].filter(Boolean).join(", ")}</p>
              <p>{address.country}</p>
            </address>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Order</p>
            <div className="mt-1.5 space-y-0.5 text-sm text-slate-700">
              <p>{order.email}</p>
              <p>{order.shippingMethod ?? "Standard shipping"}</p>
              {order.note ? <p className="text-xs text-slate-500">Note: {order.note}</p> : null}
            </div>
          </div>
        </div>

        <table className="w-full border-t border-slate-200">
          <thead>
            <tr>
              <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Qty
              </th>
              <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Item
              </th>
              <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                SKU
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 text-sm">{item.quantity}</td>
                <td className="py-2.5 text-sm">
                  {item.title}
                  {item.variantTitle ? (
                    <span className="text-slate-400"> · {item.variantTitle}</span>
                  ) : null}
                </td>
                <td className="py-2.5 text-sm text-slate-500">{item.sku ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Thank you for shopping with {shop.name}. Questions? {shop.email}
        </div>
      </div>
    </div>
  );
}
