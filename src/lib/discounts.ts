export type DiscountLike = {
  code: string;
  type: string; // PERCENTAGE | FIXED | FREE_SHIPPING
  value: number;
  minSubtotal: number;
  usageLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  status: string;
};

export type DiscountValidation = { ok: true } | { ok: false; error: string };

export function validateDiscountCode(
  discount: DiscountLike | null,
  subtotal: number,
  now: Date = new Date()
): DiscountValidation {
  if (!discount) return { ok: false, error: "Discount code not found." };
  if (discount.status !== "ACTIVE") return { ok: false, error: "This discount is no longer active." };
  if (discount.startsAt && discount.startsAt > now) return { ok: false, error: "This discount is not active yet." };
  if (discount.endsAt && discount.endsAt < now) return { ok: false, error: "This discount has expired." };
  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
    return { ok: false, error: "This discount has reached its usage limit." };
  }
  if (subtotal < discount.minSubtotal) {
    return { ok: false, error: "The cart does not meet the minimum for this discount." };
  }
  return { ok: true };
}

export function computeDiscountAmount(
  discount: Pick<DiscountLike, "type" | "value">,
  subtotal: number
): number {
  if (subtotal <= 0) return 0;
  if (discount.type === "PERCENTAGE") {
    const pct = Math.max(0, Math.min(100, discount.value));
    return Math.min(subtotal, Math.round((subtotal * pct) / 100));
  }
  if (discount.type === "FIXED") {
    return Math.min(subtotal, Math.max(0, discount.value));
  }
  return 0;
}

export function isFreeShippingDiscount(discount: Pick<DiscountLike, "type"> | null | undefined): boolean {
  return discount?.type === "FREE_SHIPPING";
}

export type TotalsInput = {
  subtotal: number;
  discountAmount: number;
  freeShipping: boolean;
  shipping: number;
  taxRatePct: number;
  taxShipping: boolean;
};

export type Totals = {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
};

export function computeTotals(input: TotalsInput): Totals {
  const subtotal = Math.max(0, Math.round(input.subtotal));
  const discountTotal = Math.max(0, Math.min(subtotal, Math.round(input.discountAmount)));
  const shippingTotal = input.freeShipping ? 0 : Math.max(0, Math.round(input.shipping));
  const taxableBase =
    subtotal - discountTotal + (input.taxShipping ? shippingTotal : 0);
  const taxTotal = Math.max(0, Math.round((taxableBase * Math.max(0, input.taxRatePct)) / 100));
  const total = Math.max(0, subtotal - discountTotal + shippingTotal + taxTotal);
  return { subtotal, discountTotal, shippingTotal, taxTotal, total };
}
