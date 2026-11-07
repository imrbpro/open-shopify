"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type DiscoveredProduct = {
  handle: string;
  title: string;
  vendor: string;
  image: string | null;
  minPrice: number;
  compareAtPrice?: number | null;
  soldOut?: boolean;
};

type WishlistValue = {
  items: DiscoveredProduct[];
  ready: boolean;
  count: number;
  has: (handle: string) => boolean;
  toggle: (product: DiscoveredProduct) => void;
  remove: (handle: string) => void;
  clear: () => void;
};

type RecentlyViewedValue = {
  items: DiscoveredProduct[];
  ready: boolean;
  record: (product: DiscoveredProduct) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);
const RecentlyViewedContext = createContext<RecentlyViewedValue | null>(null);

const MAX_RECENT = 8;

function readStorage(key: string): DiscoveredProduct[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DiscoveredProduct =>
        item &&
        typeof item === "object" &&
        typeof item.handle === "string" &&
        typeof item.title === "string" &&
        typeof item.minPrice === "number" &&
        Number.isFinite(item.minPrice)
    );
  } catch {
    return [];
  }
}

function persist(key: string, items: DiscoveredProduct[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // storage can be unavailable in private mode
  }
}

export function DiscoveryProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const wishlistKey = `os_wishlist_${slug}`;
  const recentKey = `os_recent_${slug}`;
  const [wishlist, setWishlist] = useState<DiscoveredProduct[]>([]);
  const [recent, setRecent] = useState<DiscoveredProduct[]>([]);
  const [wishlistReady, setWishlistReady] = useState(false);
  const [recentReady, setRecentReady] = useState(false);

  useEffect(() => {
    setWishlist(readStorage(wishlistKey));
    setWishlistReady(true);
  }, [wishlistKey]);

  useEffect(() => {
    setRecent(readStorage(recentKey));
    setRecentReady(true);
  }, [recentKey]);

  useEffect(() => {
    if (!wishlistReady) return;
    persist(wishlistKey, wishlist);
  }, [wishlist, wishlistReady, wishlistKey]);

  useEffect(() => {
    if (!recentReady) return;
    persist(recentKey, recent);
  }, [recent, recentReady, recentKey]);

  const toggle = useCallback((product: DiscoveredProduct) => {
    setWishlist((current) =>
      current.some((entry) => entry.handle === product.handle)
        ? current.filter((entry) => entry.handle !== product.handle)
        : [product, ...current].slice(0, 100)
    );
  }, []);

  const remove = useCallback((handle: string) => {
    setWishlist((current) => current.filter((entry) => entry.handle !== handle));
  }, []);

  const clearWishlist = useCallback(() => setWishlist([]), []);
  const clearRecent = useCallback(() => setRecent([]), []);

  const record = useCallback((product: DiscoveredProduct) => {
    setRecent((current) =>
      [product, ...current.filter((entry) => entry.handle !== product.handle)].slice(0, MAX_RECENT)
    );
  }, []);

  const wishlistValue = useMemo<WishlistValue>(
    () => ({
      items: wishlist,
      ready: wishlistReady,
      count: wishlist.length,
      has: (handle) => wishlist.some((entry) => entry.handle === handle),
      toggle,
      remove,
      clear: clearWishlist
    }),
    [wishlist, wishlistReady, toggle, remove, clearWishlist]
  );

  const recentValue = useMemo<RecentlyViewedValue>(
    () => ({ items: recent, ready: recentReady, record, clear: clearRecent }),
    [recent, recentReady, record, clearRecent]
  );

  return (
    <RecentlyViewedContext.Provider value={recentValue}>
      <WishlistContext.Provider value={wishlistValue}>{children}</WishlistContext.Provider>
    </RecentlyViewedContext.Provider>
  );
}

export function useWishlist(): WishlistValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside DiscoveryProvider");
  return context;
}

export function useRecentlyViewed(): RecentlyViewedValue {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error("useRecentlyViewed must be used inside DiscoveryProvider");
  return context;
}
