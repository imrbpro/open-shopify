"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  handle: string;
  title: string;
  variantTitle: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
};

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(key: string): CartItem[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item === "object" &&
        typeof item.variantId === "string" &&
        typeof item.price === "number" &&
        Number.isFinite(item.price) &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const storageKey = `os_cart_${slug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStorage(storageKey));
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // storage can be unavailable in private mode
    }
  }, [items, ready, storageKey]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((line) => line.variantId === item.variantId);
      if (existing) {
        return current.map((line) =>
          line.variantId === item.variantId
            ? { ...line, quantity: Math.min(99, line.quantity + quantity) }
            : line
        );
      }
      return [...current, { ...item, quantity: Math.min(99, Math.max(1, quantity)) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((line) => line.variantId !== variantId)
        : current.map((line) =>
            line.variantId === variantId ? { ...line, quantity: Math.min(99, quantity) } : line
          )
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((current) => current.filter((line) => line.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { items, ready, count, subtotal, addItem, setQuantity, removeItem, clear };
  }, [items, ready, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
