import Link from "next/link";
import { moneyInputValue } from "@/lib/money";
import { parseCollectionRules } from "@/lib/catalog";

export type CollectionFormData = {
  id?: string;
  title?: string;
  handle?: string;
  description?: string;
  image?: string | null;
  type?: string;
  rulesJson?: string | null;
  productIds?: string[];
};

export function CollectionForm({
  action,
  shopSlug,
  collection,
  products,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  shopSlug: string;
  collection?: CollectionFormData;
  products: { id: string; title: string; image: string | null; status: string }[];
  submitLabel: string;
}) {
  const rules = parseCollectionRules(collection?.rulesJson);
  const selected = new Set(collection?.productIds ?? []);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="shopSlug" value={shopSlug} />
      {collection?.id ? <input type="hidden" name="id" value={collection.id} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card card-pad space-y-4">
            <div>
              <label htmlFor="title" className="label">
                Title *
              </label>
              <input
                id="title"
                name="title"
                className="input"
                defaultValue={collection?.title}
                placeholder="New Arrivals"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="input min-h-[100px]"
                defaultValue={collection?.description}
                placeholder="Shown at the top of the collection page."
              />
            </div>
            <div>
              <label htmlFor="image" className="label">
                Image URL
              </label>
              <input
                id="image"
                name="image"
                className="input"
                defaultValue={collection?.image ?? ""}
                placeholder="/images/product-1.svg"
              />
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="section-title">Products</h2>
            <p className="mb-3 text-xs text-slate-500">
              Manual collections use these picks. Automated collections ignore them and evaluate
              rules instead.
            </p>
            <div className="scrollbar-thin max-h-72 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {products.map((product) => (
                <label
                  key={product.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    name="productIds"
                    value={product.id}
                    defaultChecked={selected.has(product.id)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <img
                    src={product.image ?? "/images/placeholder.svg"}
                    alt=""
                    className="h-7 w-7 rounded border border-slate-200 object-cover"
                  />
                  <span className="text-sm text-slate-700">{product.title}</span>
                  {product.status !== "ACTIVE" ? (
                    <span className="badge bg-slate-100 text-slate-500">{product.status.toLowerCase()}</span>
                  ) : null}
                </label>
              ))}
              {products.length === 0 ? (
                <p className="px-2 py-4 text-sm text-slate-500">No products yet.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card card-pad space-y-4">
            <div>
              <label htmlFor="type" className="label">
                Collection type
              </label>
              <select
                id="type"
                name="type"
                className="input"
                defaultValue={collection?.type ?? "MANUAL"}
              >
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATED">Automated</option>
              </select>
            </div>
            <div>
              <label htmlFor="handle" className="label">
                URL handle
              </label>
              <input
                id="handle"
                name="handle"
                className="input"
                defaultValue={collection?.handle}
                placeholder="new-arrivals"
              />
            </div>
          </div>

          <div className="card card-pad space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Automated rules</h2>
              <p className="text-xs text-slate-500">
                Products matching every filled rule are included automatically.
              </p>
            </div>
            <div>
              <label className="label">Product type</label>
              <input
                name="ruleProductType"
                className="input"
                defaultValue={rules.productType ?? ""}
                placeholder="Home"
              />
            </div>
            <div>
              <label className="label">Vendor</label>
              <input
                name="ruleVendor"
                className="input"
                defaultValue={rules.vendor ?? ""}
                placeholder="Atelier No. 8"
              />
            </div>
            <div>
              <label className="label">Tag</label>
              <input name="ruleTag" className="input" defaultValue={rules.tag ?? ""} placeholder="bestseller" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Min price</label>
                <input
                  name="rulePriceMin"
                  className="input"
                  defaultValue={rules.priceMin !== undefined ? moneyInputValue(rules.priceMin) : ""}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="label">Max price</label>
                <input
                  name="rulePriceMax"
                  className="input"
                  defaultValue={rules.priceMax !== undefined ? moneyInputValue(rules.priceMax) : ""}
                  placeholder="100.00"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <button type="submit" className="btn btn-primary w-full">
              {submitLabel}
            </button>
            <Link href={`/admin/${shopSlug}/collections`} className="btn btn-ghost mt-2 w-full text-xs">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
