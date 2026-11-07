"use client";

import { useEffect, useRef } from "react";
import { trackStoreEvent } from "@/server/actions/storefront";

export function TrackStoreEvent({
  shopSlug,
  name,
  data,
  value
}: {
  shopSlug: string;
  name: string;
  data?: Record<string, unknown>;
  value?: number;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void trackStoreEvent(shopSlug, name, data ?? {}, value);
  }, [shopSlug, name, data, value]);

  return null;
}
