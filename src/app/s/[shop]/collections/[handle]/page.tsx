import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStore, isAppInstalled } from "@/lib/storefront";
import { minVariantPrice, parseCollectionRules, productMatchesRules } from "@/lib/catalog";
import { ProductCard } from "@/components/store/product-card";

export const dynamic = "force-dynamic";

type StoreProduct = {
  handle: string;
  title: string;
  vendor: string;
  image: string | null;
  minPrice: number;
  compareAtPrice: number | null;
  soldOut: boolean;
  createdAt: Date;
};

function toCard(product: {
  handle: string;
  title: string;
  vendor: string;
  image: string | null;
  createdAt: Date;
  variants: { price: number; compareAtPrice: number | null; trackInventory: boolean; inventoryQty: number }[];
}): StoreProduct {
  const minPrice = minVariantPrice(product.variants);
  const compareAt =
    product.variants
      .map((variant) => variant.compareAtPrice)
      .filter((value): value is number => value !== null && value > minPrice)
      .sort((a, b) => a - b)[0] ?? null;
  return {
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    image: product.image,
    minPrice,
    compareAtPrice: compareAt,
    soldOut:
      product.variants.length > 0 &&
      product.variants.every((variant) => variant.trackInventory && variant.inventoryQty <= 0),
    createdAt: product.createdAt
  };
}

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: { shop: string; handle: string };
  searchParams?: { sort?: string };
}) {
  const store = await getStore(params.shop);
  const { shop } = store;
  const sort = searchParams?.sort ?? "featured";
  const isAll = params.handle === "all";

  const collection = isAll
    ? null
    : await prisma.collection.findUnique({
        where: { shopId_handle: { shopId: shop.id, handle: params.handle } },
        include: {
          products: {
            include: { product: { include: { variants: true } } },
            orderBy: { position: "asc" }
          }
        }
      });

  if (!isAll && !collection) notFound();

  let cards: StoreProduct[];
  if (collection) {
    if (collection.type === "AUTOMATED") {
      const rules = parseCollectionRules(collection.rulesJson);
      const allProducts = await prisma.product.findMany({
        where: { shopId: shop.id, status: "ACTIVE" },
        include: { variants: true },
        orderBy: { createdAt: "desc" }
      });
      cards = allProducts
        .filter((product) =>
          productMatchesRules(
            {
              productType: product.productType,
              vendor: product.vendor,
              tags: product.tags,
              minPrice: minVariantPrice(product.variants)
            },
            rules
          )
        )
        .map(toCard);
    } else {
      cards = collection.products
        .filter((link) => link.product.status === "ACTIVE")
        .map((link) => toCard(link.product));
    }
  } else {
    cards = (
      await prisma.product.findMany({
        where: { shopId: shop.id, status: "ACTIVE" },
        include: { variants: true },
        orderBy: { createdAt: "desc" }
      })
    ).map(toCard);
  }

  if (sort === "price-asc") cards.sort((a, b) => a.minPrice - b.minPrice);
  if (sort === "price-desc") cards.sort((a, b) => b.minPrice - a.minPrice);
  if (sort === "newest") cards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const title = collection?.title ?? "All products";
  const description =
    collection?.description ??
    (isAll ? "Every product in the store, in one place." : "");

  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] store-muted">Collection</p>
        <h1 className="store-heading mt-2 text-3xl font-semibold">{title}</h1>
        {description ? <p className="mt-2 text-sm store-muted">{description}</p> : null}
        <p className="mt-2 text-xs store-muted">{cards.length} products</p>
      </div>

      <div className="mb-5 flex justify-end">
        <form method="get" className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs store-muted">
            Sort by
          </label>
          <select id="sort" name="sort" defaultValue={sort} className="store-input !w-auto !py-1.5 text-xs">
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
          <button type="submit" className="store-btn-outline !px-3 !py-1.5 text-xs">
            Apply
          </button>
        </form>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-16 text-center text-sm store-muted store-border">
          No products in this collection yet.
        </p>
      ) : (
        <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((product) => (
            <ProductCard
              key={product.handle}
              slug={shop.slug}
              product={product}
              showWishlist={isAppInstalled(store, "wishlist")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
