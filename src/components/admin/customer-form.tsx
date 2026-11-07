import Link from "next/link";

export type CustomerFormData = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  tags?: string;
  note?: string | null;
  marketingOptIn?: boolean;
};

export function CustomerForm({
  action,
  shopSlug,
  customer,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  shopSlug: string;
  customer?: CustomerFormData;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="shopSlug" value={shopSlug} />
      {customer?.id ? <input type="hidden" name="id" value={customer.id} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card card-pad space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="label">
                First name *
              </label>
              <input
                id="firstName"
                name="firstName"
                className="input"
                defaultValue={customer?.firstName}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="label">
                Last name
              </label>
              <input id="lastName" name="lastName" className="input" defaultValue={customer?.lastName} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                defaultValue={customer?.email}
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">
                Phone
              </label>
              <input id="phone" name="phone" className="input" defaultValue={customer?.phone ?? ""} />
            </div>
          </div>
          <div>
            <label htmlFor="tags" className="label">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              className="input"
              defaultValue={customer?.tags}
              placeholder="vip, wholesale, newsletter"
            />
          </div>
          <div>
            <label htmlFor="note" className="label">
              Note
            </label>
            <textarea
              id="note"
              name="note"
              className="input min-h-[100px]"
              defaultValue={customer?.note ?? ""}
              placeholder="Internal notes about this customer."
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="marketingOptIn"
              defaultChecked={customer?.marketingOptIn}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Customer consented to marketing emails
          </label>
        </div>

        <div className="space-y-4">
          <div className="card card-pad">
            <button type="submit" className="btn btn-primary w-full">
              {submitLabel}
            </button>
            <Link
              href={`/admin/${shopSlug}/customers`}
              className="btn btn-ghost mt-2 w-full text-xs"
            >
              Cancel
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            Customer order counts and lifetime spend are updated automatically when orders are
            placed or marked as paid.
          </div>
        </div>
      </div>
    </form>
  );
}
