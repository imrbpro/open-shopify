import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Banner, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { q?: string; status?: string; deleted?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const q = searchParams?.q?.trim() ?? "";
  const status = ["ACTIVE", "DRAFT", "ARCHIVED"].includes(searchParams?.status ?? "")
    ? searchParams!.status!
    : "";

  const products = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { vendor: { contains: q } },
              { tags: { contains: q.toLowerCase() } },
              { variants: { some: { sku: { contains: q } } } }
            ]
          }
        : {})
    },
    include: { variants: true },
    orderBy: { updatedAt: "desc" },
    take: 200
  });

  const statuses = [
    { key: "", label: "All" },
    { key: "ACTIVE", label: "Active" },
    { key: "DRAFT", label: "Drafts" },
    { key: "ARCHIVED", label: "Archived" }
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}`}
        actions={
          <Link href={`/admin/${shop.slug}/products/new`} className="btn btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Add product
          </Link>
        }
      />

      {searchParams?.deleted ? <div className="mb-4"><Banner kind="success">Product deleted.</Banner></div> : null}
      {searchParams?.error ? <div className="mb-4"><Banner>{searchParams.error}</Banner></div> : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {statuses.map((tab) => {
            const href = `/admin/${shop.slug}/products?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(tab.key ? { status: tab.key } : {})
            }).toString()}`;
            const active = status === tab.key;
            return (
              <Link
                key={tab.key || "all"}
                href={href}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <form method="get" className="flex items-center gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search products or SKU"
              className="input w-64 pl-8"
            />
          </div>
          <button className="btn btn-outline" type="submit">
            Search
          </button>
        </form>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={q || status ? "No products match those filters" : "Add your first product"}
          description={
            q || status
              ? "Try a different search term or status filter."
              : "Products power your storefront, orders and collections. Start with a title, price and inventory."
          }
          action={
            <Link href={`/admin/${shop.slug}/products/new`} className="btn btn-primary">
              Add product
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Status</th>
                  <th className="th">Inventory</th>
                  <th className="th">Price</th>
                  <th className="th">Type</th>
                  <th className="th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const inventory = product.variants.reduce(
                    (sum, variant) => sum + (variant.trackInventory ? variant.inventoryQty : 0),
                    0
                  );
                  const prices = product.variants.map((variant) => variant.price);
                  const min = prices.length ? Math.min(...prices) : 0;
                  const max = prices.length ? Math.max(...prices) : 0;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70">
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image ?? "/images/placeholder.svg"}
                            alt=""
                            className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/${shop.slug}/products/${product.id}`}
                              className="font-medium text-slate-900 hover:text-emerald-700"
                            >
                              {product.title}
                            </Link>
                            <p className="text-[11px] text-slate-400">
                              {product.vendor || "No vendor"} · {product.variants.length} variant
                              {product.variants.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="td">
                        {inventory === 0 ? (
                          <span className="badge bg-red-50 text-red-700">Sold out</span>
                        ) : (
                          <span className={inventory <= 5 ? "text-amber-700" : "text-slate-700"}>
                            {inventory} in stock
                          </span>
                        )}
                      </td>
                      <td className="td">
                        {min === max
                          ? formatMoney(min, shop.currency)
                          : `${formatMoney(min, shop.currency)}–${formatMoney(max, shop.currency)}`}
                      </td>
                      <td className="td text-slate-500">{product.productType || "—"}</td>
                      <td className="td text-right">
                        <Link
                          href={`/admin/${shop.slug}/products/${product.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
