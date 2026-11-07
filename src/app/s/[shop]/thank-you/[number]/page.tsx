import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStore } from "@/lib/storefront";
import { formatMoney } from "@/lib/money";
import { jsonObject } from "@/lib/utils";
import { ClearCart } from "@/components/store/clear-cart";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
};

export default async function ThankYouPage({
  params
}: {
  params: { shop: string; number: string };
}) {
  const store = await getStore(params.shop);
  const number = Number(params.number);
  if (!Number.isInteger(number)) notFound();

  const order = await prisma.order.findUnique({
    where: { shopId_number: { shopId: store.shop.id, number } },
    include: { items: true }
  });
  if (!order) notFound();

  const address = jsonObject<ShippingAddress>(order.shippingAddressJson, {});
  const pending = order.financialStatus === "PENDING";

  return (
    <div className="mx-auto max-w-2xl">
      <ClearCart />
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Icon name="check" className="h-7 w-7" />
        </div>
        <h1 className="store-heading mt-5 text-3xl font-semibold">
          {pending ? "Order received" : "Thank you for your order"}
        </h1>
        <p className="mt-2 text-sm store-muted">
          Order <span className="font-semibold">#{order.number}</span> · Confirmation sent to{" "}
          <span className="font-medium">{order.email}</span>
        </p>
        {pending ? (
          <p className="mx-auto mt-3 max-w-md rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
            Your order is awaiting manual payment. We&apos;ll email instructions and mark it paid once
            funds clear.
          </p>
        ) : null}
      </div>

      <div className="store-card mt-8 p-5">
        <h2 className="store-heading text-lg font-semibold">Order summary</h2>
        <ul className="mt-4 divide-y store-divider">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="h-14 w-12 shrink-0 overflow-hidden rounded border store-border" style={{ background: "var(--os-surface)" }}>
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.variantTitle && item.variantTitle !== "Default Title" ? (
                  <p className="text-xs store-muted">{item.variantTitle}</p>
                ) : null}
                <p className="text-xs store-muted">Qty {item.quantity}</p>
              </div>
              <span className="text-sm font-medium">{formatMoney(item.total, order.currency)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1.5 border-t pt-4 text-sm store-divider">
          <div className="flex justify-between">
            <span className="store-muted">Subtotal</span>
            <span>{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          {order.discountTotal > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>Discount {order.discountCode ? `(${order.discountCode})` : ""}</span>
              <span>−{formatMoney(order.discountTotal, order.currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="store-muted">Shipping</span>
            <span>
              {order.shippingTotal === 0 ? "Free" : formatMoney(order.shippingTotal, order.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="store-muted">Tax</span>
            <span>{formatMoney(order.taxTotal, order.currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold store-divider">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="store-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide store-muted">Shipping to</h3>
          <p className="mt-2 text-sm leading-relaxed">
            {address.name}
            <br />
            {address.line1}
            {address.line2 ? (
              <>
                <br />
                {address.line2}
              </>
            ) : null}
            <br />
            {[address.city, address.province, address.zip].filter(Boolean).join(", ")}
            <br />
            {address.country}
          </p>
        </div>
        <div className="store-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide store-muted">Payment & delivery</h3>
          <p className="mt-2 text-sm">
            {order.paymentMethod}
            <br />
            <span className="store-muted">{order.shippingMethod}</span>
          </p>
          <p className="mt-2 text-xs store-muted">
            {pending ? "Payment pending" : "Payment captured"} ·{" "}
            {order.fulfillmentStatus === "FULFILLED" ? "Fulfilled" : "Preparing for shipment"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/s/${store.shop.slug}/collections/all`} className="store-btn">
          Continue shopping
        </Link>
        <Link href={`/s/${store.shop.slug}/order-lookup`} className="store-btn-outline">
          Look up another order
        </Link>
      </div>
    </div>
  );
}
