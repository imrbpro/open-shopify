"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { Icon } from "@/components/icons";

export function CartBadge({ slug }: { slug: string }) {
  const { count, ready } = useCart();
  return (
    <Link
      href={`/s/${slug}/cart`}
      className="relative inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 store-border"
      style={{ color: "var(--os-text)" }}
    >
      <Icon name="cart" className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {ready && count > 0 ? (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ background: "var(--os-primary)" }}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
