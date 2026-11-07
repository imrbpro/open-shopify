import Link from "next/link";
import { VariantsEditor, type VariantFormValue } from "./variants-editor";

export type ProductFormData = {
  id?: string;
  title?: string;
  handle?: string;
  description?: string;
  vendor?: string;
  productType?: string;
  tags?: string;
  status?: string;
  image?: string;
  variants?: VariantFormValue[];
};

export function ProductForm({
  action,
  shopSlug,
  product,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  shopSlug: string;
  product?: ProductFormData;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="shopSlug" value={shopSlug} />
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}

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
                defaultValue={product?.title}
                placeholder="Everyday Tee"
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
                className="input min-h-[160px]"
                defaultValue={product?.description}
                placeholder="Describe materials, fit, and care."
              />
              <p className="hint">Plain text. Rendered on the storefront product page.</p>
            </div>
            <div>
              <label htmlFor="image" className="label">
                Image URL
              </label>
              <input
                id="image"
                name="image"
                className="input"
                defaultValue={product?.image}
                placeholder="/images/placeholder.svg or https://…"
              />
              <p className="hint">Local path or remote URL. Defaults to a placeholder image.</p>
            </div>
          </div>

          <div className="card card-pad">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="section-title">Variants</h2>
                <p className="text-xs text-slate-500">
                  Price, SKU and inventory for each purchasable option.
                </p>
              </div>
            </div>
            <VariantsEditor initial={product?.variants} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card card-pad space-y-4">
            <div>
              <label htmlFor="status" className="label">
                Status
              </label>
              <select id="status" name="status" className="input" defaultValue={product?.status ?? "ACTIVE"}>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
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
                defaultValue={product?.handle}
                placeholder="everyday-tee"
              />
              <p className="hint">Leave blank to generate from the title.</p>
            </div>
          </div>

          <div className="card card-pad space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Organization</h2>
            <div>
              <label htmlFor="vendor" className="label">
                Vendor
              </label>
              <input
                id="vendor"
                name="vendor"
                className="input"
                defaultValue={product?.vendor}
                placeholder="Northwind Supply"
              />
            </div>
            <div>
              <label htmlFor="productType" className="label">
                Product type
              </label>
              <input
                id="productType"
                name="productType"
                className="input"
                defaultValue={product?.productType}
                placeholder="Apparel"
              />
            </div>
            <div>
              <label htmlFor="tags" className="label">
                Tags
              </label>
              <input
                id="tags"
                name="tags"
                className="input"
                defaultValue={product?.tags}
                placeholder="new, cotton, bestseller"
              />
              <p className="hint">Comma separated. Used by automated collections.</p>
            </div>
          </div>

          <div className="card card-pad">
            <button type="submit" className="btn btn-primary w-full">
              {submitLabel}
            </button>
            <Link href={`/admin/${shopSlug}/products`} className="btn btn-ghost mt-2 w-full text-xs">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
