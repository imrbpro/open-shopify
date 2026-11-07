"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-provider";
import { formatMoney } from "@/lib/money";

export type PurchaseVariant = {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  inventoryQty: number;
  trackInventory: boolean;
  sku: string | null;
};

export function ProductPurchase({
  slug,
  product,
  variants
}: {
  slug: string;
  product: { id: string; title: string; handle: string; image: string | null };
  variants: PurchaseVariant[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((entry) => entry.id === variantId) ?? variants[0];
  if (!variant) {
    return <p className="text-sm store-muted">This product is currently unavailable.</p>;
  }

  const soldOut = variant.trackInventory && variant.inventoryQty <= 0;
  const maxQty = variant.trackInventory ? Math.max(1, variant.inventoryQty) : 99;

  function add(): boolean {
    if (soldOut) return false;
    addItem(
      {
        variantId: variant.id,
        productId: product.id,
        handle: product.handle,
        title: product.title,
        variantTitle: variant.title,
        price: variant.price,
        image: product.image ?? undefined,
        sku: variant.sku ?? undefined
      },
      quantity
    );
    return true;
  }

  return (
    <div className="space-y-4">
      {variants.length > 1 ? (
        <div>
          <span className="store-label">Variant</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((option) => {
              const unavailable = option.trackInventory && option.inventoryQty <= 0;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setVariantId(option.id)}
                  disabled={unavailable}
                  className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 store-border"
                  style={
                    option.id === variant.id
                      ? { background: "var(--os-text)", color: "var(--os-bg)", borderColor: "var(--os-text)" }
                      : undefined
                  }
                >
                  {option.title}
                  {unavailable ? " · sold out" : ""}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border store-border">
          <button
            type="button"
            className="px-3 py-2 text-sm"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            className="px-3 py-2 text-sm"
            onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <span className="text-sm font-semibold">{formatMoney(variant.price)}</span>
        {variant.compareAtPrice && variant.compareAtPrice > variant.price ? (
          <span className="text-sm line-through store-muted">{formatMoney(variant.compareAtPrice)}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            if (!add()) return;
            setAdded(true);
            window.setTimeout(() => setAdded(false), 2200);
          }}
          disabled={soldOut}
          className="store-btn flex-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {soldOut ? "Sold out" : added ? "Added to cart ✓" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!add()) return;
            router.push(`/s/${slug}/cart`);
          }}
          disabled={soldOut}
          className="store-btn-outline flex-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy it now
        </button>
      </div>

      <p className="text-xs store-muted">
        {variant.trackInventory
          ? variant.inventoryQty > 0
            ? `${variant.inventoryQty} in stock${variant.sku ? ` · SKU ${variant.sku}` : ""}`
            : "Out of stock"
          : "In stock"}
      </p>
      {added ? (
        <p className="text-xs font-medium text-emerald-700">
          Added —{" "}
          <a href={`/s/${slug}/cart`} className="underline">
            view cart
          </a>
        </p>
      ) : null}
    </div>
  );
}
