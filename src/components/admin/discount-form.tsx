import Link from "next/link";
import { moneyInputValue } from "@/lib/money";

export type DiscountFormData = {
  id?: string;
  code?: string;
  type?: string;
  value?: number;
  minSubtotal?: number;
  usageLimit?: number | null;
  oncePerCustomer?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

function dateValue(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function DiscountForm({
  action,
  shopSlug,
  discount,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  shopSlug: string;
  discount?: DiscountFormData;
  submitLabel: string;
}) {
  const type = discount?.type ?? "PERCENTAGE";
  const valueDisplay =
    type === "FIXED" && discount?.value
      ? moneyInputValue(discount.value)
      : type === "PERCENTAGE" && discount?.value
        ? String(discount.value)
        : "";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="shopSlug" value={shopSlug} />
      {discount?.id ? <input type="hidden" name="id" value={discount.id} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card card-pad space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="code" className="label">
                  Discount code *
                </label>
                <input
                  id="code"
                  name="code"
                  className="input font-mono uppercase"
                  defaultValue={discount?.code}
                  placeholder="WELCOME10"
                  required
                />
                <p className="hint">Customers enter this at checkout.</p>
              </div>
              <div>
                <label htmlFor="type" className="label">
                  Type
                </label>
                <select id="type" name="type" className="input" defaultValue={type}>
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED">Fixed amount off</option>
                  <option value="FREE_SHIPPING">Free shipping</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="value" className="label">
                  Value
                </label>
                <input
                  id="value"
                  name="value"
                  className="input"
                  defaultValue={valueDisplay}
                  placeholder={type === "PERCENTAGE" ? "10" : "5.00"}
                  inputMode="decimal"
                />
                <p className="hint">Percentage (0–100) or amount. Ignored for free shipping.</p>
              </div>
              <div>
                <label htmlFor="minSubtotal" className="label">
                  Minimum subtotal
                </label>
                <input
                  id="minSubtotal"
                  name="minSubtotal"
                  className="input"
                  defaultValue={discount?.minSubtotal ? moneyInputValue(discount.minSubtotal) : ""}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="usageLimit" className="label">
                  Usage limit
                </label>
                <input
                  id="usageLimit"
                  name="usageLimit"
                  className="input"
                  defaultValue={discount?.usageLimit ?? ""}
                  placeholder="Unlimited"
                  inputMode="numeric"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="oncePerCustomer"
                    defaultChecked={discount?.oncePerCustomer}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  Limit to one use per customer
                </label>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="section-title">Active dates</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startsAt" className="label">
                  Start date
                </label>
                <input
                  id="startsAt"
                  name="startsAt"
                  type="date"
                  className="input"
                  defaultValue={dateValue(discount?.startsAt)}
                />
              </div>
              <div>
                <label htmlFor="endsAt" className="label">
                  End date
                </label>
                <input
                  id="endsAt"
                  name="endsAt"
                  type="date"
                  className="input"
                  defaultValue={dateValue(discount?.endsAt)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card card-pad">
            <button type="submit" className="btn btn-primary w-full">
              {submitLabel}
            </button>
            <Link href={`/admin/${shopSlug}/discounts`} className="btn btn-ghost mt-2 w-full text-xs">
              Cancel
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            Discounts apply to the cart subtotal before tax. Free shipping waives the selected
            shipping rate at checkout.
          </div>
        </div>
      </div>
    </form>
  );
}
