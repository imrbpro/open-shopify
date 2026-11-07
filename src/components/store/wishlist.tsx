"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductCard } from "./product-card";
import { useRecentlyViewed, useWishlist, type DiscoveredProduct } from "./discovery-provider";

export function WishlistButton({
  product,
  withLabel = false,
  className = ""
}: {
  product: DiscoveredProduct;
  withLabel?: boolean;
  className?: string;
}) {
  const { has, toggle, ready } = useWishlist();
  const active = ready && has(product.handle);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(product);
      }}
      className={
        withLabel
          ? `store-btn-outline inline-flex items-center justify-center gap-2 ${className}`
          : `inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-colors store-border ${className}`
      }
      style={
        active
          ? { background: "var(--os-primary)", borderColor: "var(--os-primary)", color: "var(--os-bg)" }
          : { background: "color-mix(in srgb, var(--os-bg) 82%, transparent)", color: "var(--os-text)" }
      }
    >
      <Icon name="heart" className="h-4 w-4" fill={active ? "currentColor" : "none"} />
      {withLabel ? <span>{active ? "Saved to wishlist" : "Add to wishlist"}</span> : null}
    </button>
  );
}

export function WishlistBadge({ slug }: { slug: string }) {
  const { count, ready } = useWishlist();
  return (
    <Link
      href={`/s/${slug}/wishlist`}
      className="relative inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 store-border"
      style={{ color: "var(--os-text)" }}
      aria-label="Wishlist"
    >
      <Icon name="heart" className="h-4 w-4" />
      <span className="hidden sm:inline">Wishlist</span>
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

export function RecordRecentlyViewed({ product }: { product: DiscoveredProduct }) {
  const { record } = useRecentlyViewed();
  const latest = useRef(product);
  latest.current = product;
  useEffect(() => {
    record(latest.current);
  }, [record, product.handle]);
  return null;
}

export function WishlistView({ slug }: { slug: string }) {
  const { items, ready, clear } = useWishlist();

  if (!ready) {
    return <p className="py-10 text-sm store-muted">Loading your wishlist…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="store-card p-10 text-center">
        <Icon name="heart" className="mx-auto h-8 w-8" />
        <h2 className="store-heading mt-4 text-xl font-semibold">Your wishlist is empty</h2>
        <p className="mt-1 text-sm store-muted">
          Tap the heart on any product to keep it here for later.
        </p>
        <Link href={`/s/${slug}/collections/all`} className="store-btn mt-5 inline-flex">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs store-muted">
          Saved in this browser · {items.length} item{items.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium underline store-muted"
        >
          Clear wishlist
        </button>
      </div>
      <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.handle} slug={slug} product={product} showWishlist />
        ))}
      </div>
    </div>
  );
}

export function RecentlyViewedRail({
  slug,
  title = "Recently viewed"
}: {
  slug: string;
  title?: string;
}) {
  const { items, ready } = useRecentlyViewed();
  if (!ready || items.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="store-heading mb-5 text-xl font-semibold">{title}</h2>
      <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((product) => (
          <ProductCard key={product.handle} slug={slug} product={product} showWishlist />
        ))}
      </div>
    </section>
  );
}
