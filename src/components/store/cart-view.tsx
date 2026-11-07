"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { formatMoney } from "@/lib/money";
import { Icon } from "@/components/icons";

export function CartView({ slug, currency }: { slug: string; currency: string }) {
  const { items, ready, subtotal, setQuantity, removeItem } = useCart();

  if (!ready) {
    return <div className="py-16 text-center text-sm store-muted">Loading your cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border store-border">
          <Icon name="cart" className="h-6 w-6" />
        </div>
        <h2 className="store-heading text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-sm store-muted">Find something you love and come back.</p>
        <Link href={`/s/${slug}/collections/all`} className="store-btn mt-6 inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="divide-y store-divider border-y store-border">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 py-4">
              <Link
                href={`/s/${slug}/products/${item.handle}`}
                className="h-24 w-20 shrink-0 overflow-hidden rounded-lg border store-border"
                style={{ background: "var(--os-surface)" }}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/s/${slug}/products/${item.handle}`}
                      className="text-sm font-medium hover:opacity-70"
                    >
                      {item.title}
                    </Link>
                    {item.variantTitle && item.variantTitle !== "Default Title" ? (
                      <p className="text-xs store-muted">{item.variantTitle}</p>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium">{formatMoney(item.price * item.quantity, currency)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-full border store-border">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm"
                      onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                      aria-label={`Decrease ${item.title}`}
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-xs font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm"
                      onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                      aria-label={`Increase ${item.title}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="text-xs font-medium underline store-muted hover:opacity-70"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Link href={`/s/${slug}/collections/all`} className="mt-5 inline-flex text-sm font-medium underline">
          Continue shopping
        </Link>
      </div>

      <div className="store-card h-fit p-5">
        <h2 className="store-heading text-lg font-semibold">Order summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="store-muted">Subtotal</span>
            <span className="font-medium">{formatMoney(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="store-muted">Shipping</span>
            <span className="text-xs store-muted">Calculated at checkout</span>
          </div>
          <div className="flex justify-between">
            <span className="store-muted">Tax</span>
            <span className="text-xs store-muted">Calculated at checkout</span>
          </div>
        </div>
        <Link href={`/s/${slug}/checkout`} className="store-btn mt-5 w-full">
          Checkout
        </Link>
        <p className="mt-3 text-center text-[11px] store-muted">
          Secure simulated checkout · discounts applied at checkout
        </p>
      </div>
    </div>
  );
}
