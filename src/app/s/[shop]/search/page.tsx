import { prisma } from "@/lib/db";
import { getStore } from "@/lib/storefront";
import { minVariantPrice } from "@/lib/catalog";
import { ProductCard } from "@/components/store/product-card";
import { TrackStoreEvent } from "@/components/store/track-event";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { q?: string };
}) {
  const store = await getStore(params.shop);
  const { shop } = store;
  const query = (searchParams?.q ?? "").trim();

  const products = query
    ? await prisma.product.findMany({
        where: {
          shopId: shop.id,
          status: "ACTIVE",
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { vendor: { contains: query } },
            { tags: { contains: query } },
            { productType: { contains: query } }
          ]
        },
        include: { variants: true },
        take: 36,
        orderBy: { createdAt: "desc" }
      })
    : [];

  return (
    <div>
      {query ? <TrackStoreEvent shopSlug={shop.slug} name="search" data={{ query }} /> : null}

      <div className="mx-auto max-w-xl text-center">
        <h1 className="store-heading text-3xl font-semibold">Search</h1>
        <p className="mt-1 text-sm store-muted">Find products by name, vendor or tag.</p>
        <form method="get" className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 store-muted" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search the store…"
              className="store-input pl-9"
              aria-label="Search products"
            />
          </div>
          <button type="submit" className="store-btn shrink-0 !px-5 !py-2 text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="mt-10">
        {query ? (
          <>
            <p className="mb-5 text-sm store-muted">
              {products.length} result{products.length === 1 ? "" : "s"} for “{query}”
            </p>
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-16 text-center store-border">
                <p className="text-sm font-medium">No matches found</p>
                <p className="mt-1 text-xs store-muted">
                  Try a broader term, or browse the full catalogue.
                </p>
                <a href={`/s/${shop.slug}/collections/all`} className="store-btn mt-5 inline-flex text-xs">
                  Shop all products
                </a>
              </div>
            ) : (
              <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => {
                  const minPrice = minVariantPrice(product.variants);
                  const compareAt =
                    product.variants
                      .map((variant) => variant.compareAtPrice)
                      .filter((value): value is number => value !== null && value > minPrice)
                      .sort((a, b) => a - b)[0] ?? null;
                  return (
                    <ProductCard
                      key={product.id}
                      slug={shop.slug}
                      product={{
                        handle: product.handle,
                        title: product.title,
                        vendor: product.vendor,
                        image: product.image,
                        minPrice,
                        compareAtPrice: compareAt,
                        soldOut:
                          product.variants.length > 0 &&
                          product.variants.every(
                            (variant) => variant.trackInventory && variant.inventoryQty <= 0
                          )
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="py-10 text-center text-sm store-muted">
            Start typing to search the catalogue.
          </p>
        )}
      </div>
    </div>
  );
}
