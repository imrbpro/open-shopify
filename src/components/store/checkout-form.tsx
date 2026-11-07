"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { useCart } from "./cart-provider";
import { TrackStoreEvent } from "./track-event";
import { placeOrder, previewDiscount } from "@/server/actions/storefront";
import { formatMoney } from "@/lib/money";
import type { CheckoutState } from "@/lib/types";
import Link from "next/link";

type ShippingRate = { id: string; name: string; price: number; minSubtotal: number };

type AppliedDiscount = {
  code: string;
  type: string;
  value: number;
  freeShipping: boolean;
};

const COUNTRIES = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["AU", "Australia"],
  ["JP", "Japan"],
  ["TR", "Türkiye"]
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="store-btn w-full disabled:opacity-50">
      {pending ? "Working…" : label}
    </button>
  );
}

export function CheckoutForm({
  slug,
  currency,
  rates,
  taxRatePct,
  taxShipping,
  paymentProvider,
  paymentName,
  checkoutNote
}: {
  slug: string;
  currency: string;
  rates: ShippingRate[];
  taxRatePct: number;
  taxShipping: boolean;
  paymentProvider: string;
  paymentName: string;
  checkoutNote: string;
}) {
  const router = useRouter();
  const { items, ready, subtotal, clear } = useCart();
  const [state, formAction] = useFormState<CheckoutState, FormData>(placeOrder, undefined);
  const [rateId, setRateId] = useState(rates[0]?.id ?? "");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (state?.redirectUrl) {
      clear();
      window.location.assign(state.redirectUrl);
      return;
    }
    if (state?.orderNumber) {
      clear();
      router.push(`/s/${slug}/thank-you/${state.orderNumber}`);
    }
  }, [state, clear, router, slug]);

  const selectedRate = rates.find((rate) => rate.id === rateId) ?? null;

  const summary = useMemo(() => {
    const discountAmount = discount
      ? discount.freeShipping
        ? 0
        : discount.type === "PERCENTAGE"
          ? Math.min(subtotal, Math.round((subtotal * discount.value) / 100))
          : Math.min(subtotal, discount.value)
      : 0;
    const freeShipping = discount?.freeShipping ?? false;
    const shipping = freeShipping
      ? 0
      : selectedRate
        ? selectedRate.minSubtotal > 0 && subtotal >= selectedRate.minSubtotal
          ? 0
          : selectedRate.price
        : 0;
    const taxable = Math.max(0, subtotal - discountAmount + (taxShipping ? shipping : 0));
    const tax = Math.round((taxable * Math.max(0, taxRatePct)) / 100);
    const total = Math.max(0, subtotal - discountAmount + shipping + tax);
    return { discountAmount, shipping, tax, total };
  }, [discount, selectedRate, subtotal, taxShipping, taxRatePct]);

  async function applyCode() {
    setApplying(true);
    setDiscountError(null);
    try {
      const result = await previewDiscount(slug, discountCode, subtotal);
      if (!result.ok) {
        setDiscountError(result.error);
        setDiscount(null);
      } else {
        setDiscount({
          code: result.code,
          type: result.type,
          value: result.value,
          freeShipping: result.freeShipping
        });
      }
    } finally {
      setApplying(false);
    }
  }

  if (ready && items.length === 0 && !state?.orderNumber) {
    return (
      <div className="py-16 text-center">
        <h2 className="store-heading text-2xl font-semibold">Nothing to check out</h2>
        <p className="mt-1 text-sm store-muted">Add a few items to your cart first.</p>
        <Link href={`/s/${slug}/collections/all`} className="store-btn mt-6 inline-flex">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {ready ? (
        <TrackStoreEvent shopSlug={slug} name="checkout_started" value={Math.round(subtotal)} />
      ) : null}
      <form action={formAction} className="grid gap-8 lg:grid-cols-5">
        <input type="hidden" name="shopSlug" value={slug} />
        <input type="hidden" name="paymentMethod" value={paymentProvider} />
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })))}
        />
        <input type="hidden" name="shippingRateId" value={rateId} />
        <input type="hidden" name="discountCode" value={discount?.code ?? ""} />

        <div className="space-y-6 lg:col-span-3">
          <div className="store-card p-5">
            <h2 className="store-heading text-lg font-semibold">Contact</h2>
            <div className="mt-4">
              <label className="store-label" htmlFor="co-email">
                Email
              </label>
              <input
                id="co-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="store-input"
                placeholder="you@example.com"
              />
              <p className="mt-1 text-[11px] store-muted">Order updates will be sent here.</p>
            </div>
          </div>

          <div className="store-card p-5">
            <h2 className="store-heading text-lg font-semibold">Shipping address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="store-label" htmlFor="co-first">
                  First name
                </label>
                <input id="co-first" name="firstName" required autoComplete="given-name" className="store-input" />
              </div>
              <div>
                <label className="store-label" htmlFor="co-last">
                  Last name
                </label>
                <input id="co-last" name="lastName" autoComplete="family-name" className="store-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="store-label" htmlFor="co-address1">
                  Address
                </label>
                <input id="co-address1" name="address1" required autoComplete="address-line1" className="store-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="store-label" htmlFor="co-address2">
                  Apartment, suite, etc. (optional)
                </label>
                <input id="co-address2" name="address2" autoComplete="address-line2" className="store-input" />
              </div>
              <div>
                <label className="store-label" htmlFor="co-city">
                  City
                </label>
                <input id="co-city" name="city" required autoComplete="address-level2" className="store-input" />
              </div>
              <div>
                <label className="store-label" htmlFor="co-province">
                  State / Province
                </label>
                <input id="co-province" name="province" autoComplete="address-level1" className="store-input" />
              </div>
              <div>
                <label className="store-label" htmlFor="co-zip">
                  ZIP / Postal code
                </label>
                <input id="co-zip" name="zip" required autoComplete="postal-code" className="store-input" />
              </div>
              <div>
                <label className="store-label" htmlFor="co-country">
                  Country
                </label>
                <select id="co-country" name="country" className="store-input" defaultValue="US">
                  {COUNTRIES.map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="store-label" htmlFor="co-phone">
                  Phone (optional)
                </label>
                <input id="co-phone" name="phone" autoComplete="tel" className="store-input" />
              </div>
            </div>
          </div>

          <div className="store-card p-5">
            <h2 className="store-heading text-lg font-semibold">Shipping method</h2>
            <div className="mt-3 space-y-2">
              {rates.length === 0 ? (
                <p className="text-sm store-muted">Free shipping</p>
              ) : (
                rates.map((rate) => {
                  const free = rate.minSubtotal > 0 && subtotal >= rate.minSubtotal;
                  return (
                    <label
                      key={rate.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm store-border"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="rateChoice"
                          checked={rateId === rate.id}
                          onChange={() => setRateId(rate.id)}
                          className="h-4 w-4"
                        />
                        {rate.name}
                      </span>
                      <span className="font-medium">
                        {free ? "Free" : formatMoney(rate.price, currency)}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="store-card p-5">
            <h2 className="store-heading text-lg font-semibold">Payment</h2>
            <div className="mt-3 rounded-lg border p-3 store-border">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--os-primary)" }} />
                {paymentProvider === "simulated"
                  ? "Credit card (test mode)"
                  : paymentProvider === "manual"
                    ? "Manual payment"
                    : paymentName}
              </p>
              <p className="mt-1 text-xs store-muted">
                {paymentProvider === "simulated"
                  ? "No real charge. This demo store approves the order automatically using a simulated card."
                  : paymentProvider === "manual"
                    ? "Bank transfer or cash on delivery. We'll email instructions and mark the order paid once funds clear."
                    : paymentProvider === "stripe"
                      ? "You'll be redirected to Stripe's secure checkout. You'll return to this store when payment is complete."
                      : `You'll be redirected to ${paymentName} to complete payment. We'll confirm the order once payment is received.`}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="store-card sticky top-4 p-5">
            <h2 className="store-heading text-lg font-semibold">Order summary</h2>
            <ul className="mt-4 space-y-3 border-b pb-4 store-divider">
              {items.map((item) => (
                <li key={item.variantId} className="flex items-center gap-3">
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded border store-border">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    ) : null}
                    <span
                      className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                      style={{ background: "var(--os-primary)" }}
                    >
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.title}</p>
                    {item.variantTitle !== "Default Title" ? (
                      <p className="text-[11px] store-muted">{item.variantTitle}</p>
                    ) : null}
                  </div>
                  <span className="text-xs font-medium">
                    {formatMoney(item.price * item.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <label className="store-label" htmlFor="co-discount">
                Discount code
              </label>
              <div className="flex gap-2">
                <input
                  id="co-discount"
                  value={discountCode}
                  onChange={(event) => setDiscountCode(event.target.value)}
                  className="store-input"
                  placeholder="WELCOME10"
                />
                <button
                  type="button"
                  onClick={applyCode}
                  disabled={applying || !discountCode.trim()}
                  className="store-btn-outline shrink-0 !px-4 !py-2 text-xs disabled:opacity-50"
                >
                  {applying ? "…" : "Apply"}
                </button>
              </div>
              {discountError ? <p className="mt-1 text-xs text-red-600">{discountError}</p> : null}
              {discount ? (
                <p className="mt-1 flex items-center justify-between text-xs font-medium text-emerald-700">
                  <span>{discount.code} applied</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscount(null);
                      setDiscountCode("");
                    }}
                    className="underline"
                  >
                    Remove
                  </button>
                </p>
              ) : null}
            </div>

            <div className="mt-4 space-y-2 border-t pt-4 text-sm store-divider">
              <div className="flex justify-between">
                <span className="store-muted">Subtotal</span>
                <span>{formatMoney(subtotal, currency)}</span>
              </div>
              {summary.discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>−{formatMoney(summary.discountAmount, currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="store-muted">Shipping</span>
                <span>{summary.shipping === 0 ? "Free" : formatMoney(summary.shipping, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="store-muted">Tax{taxRatePct > 0 ? ` (${taxRatePct}%)` : ""}</span>
                <span>{formatMoney(summary.tax, currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base font-semibold store-divider">
                <span>Total</span>
                <span>{formatMoney(summary.total, currency)}</span>
              </div>
            </div>

            <div className="mt-4">
              <SubmitButton
                label={
                  paymentProvider === "stripe" || paymentProvider === "custom"
                    ? "Continue to payment"
                    : "Place order"
                }
              />
            </div>
            {state?.error ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
            ) : null}
            <p className="mt-3 text-center text-[11px] store-muted">{checkoutNote}</p>
          </div>
        </div>
      </form>
    </div>
  );
}
