import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStore, isAppInstalled } from "@/lib/storefront";
import { minVariantPrice } from "@/lib/catalog";
import { parseTags, formatDate } from "@/lib/utils";
import { ProductPurchase } from "@/components/store/product-purchase";
import { ProductCard } from "@/components/store/product-card";
import { ReviewForm } from "@/components/store/review-form";
import { TrackStoreEvent } from "@/components/store/track-event";
import {
  RecentlyViewedRail,
  RecordRecentlyViewed,
  WishlistButton
} from "@/components/store/wishlist";
import { Stars } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params
}: {
  params: { shop: string; handle: string };
}) {
  const store = await getStore(params.shop);
  const { shop, settings } = store;

  const product = await prisma.product.findFirst({
    where: { shopId: shop.id, handle: params.handle, status: "ACTIVE" },
    include: {
      variants: { orderBy: { position: "asc" } },
      images: { orderBy: { position: "asc" } },
      reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 24 }
    }
  });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: {
      shopId: shop.id,
      status: "ACTIVE",
      id: { not: product.id },
      ...(product.productType ? { productType: product.productType } : {})
    },
    include: { variants: true },
    take: 4,
    orderBy: { createdAt: "desc" }
  });

  const reviewApp = isAppInstalled(store, "product-reviews");
  const wishlistApp = isAppInstalled(store, "wishlist");
  const recentlyViewedApp = isAppInstalled(store, "recently-viewed");
  const reviews = reviewApp ? product.reviews : [];
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const gallery = Array.from(
    new Set([product.image, ...product.images.map((image) => image.url)].filter((url): url is string => Boolean(url)))
  );
  const tags = parseTags(product.tags);
  const minPrice = minVariantPrice(product.variants);
  const soldOut =
    product.variants.length > 0 &&
    product.variants.every((variant) => variant.trackInventory && variant.inventoryQty <= 0);

  return (
    <div>
      <TrackStoreEvent
        shopSlug={shop.slug}
        name="product_viewed"
        data={{ handle: product.handle, title: product.title, productId: product.id }}
        value={minPrice}
      />
      {recentlyViewedApp ? (
        <RecordRecentlyViewed
          product={{
            handle: product.handle,
            title: product.title,
            vendor: product.vendor,
            image: product.image,
            minPrice
          }}
        />
      ) : null}

      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs store-muted">
        <Link href={`/s/${shop.slug}`} className="hover:underline">
          Home
        </Link>
        <span>/</span>
        <Link href={`/s/${shop.slug}/collections/all`} className="hover:underline">
          Shop
        </Link>
        <span>/</span>
        <span>{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border store-border" style={{ background: "var(--os-surface)" }}>
            {gallery[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gallery[0]} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm store-muted">No image</div>
            )}
          </div>
          {gallery.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.slice(1, 5).map((url) => (
                <div key={url} className="aspect-square overflow-hidden rounded-lg border store-border" style={{ background: "var(--os-surface)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={product.title} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          {product.vendor ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] store-muted">{product.vendor}</p>
          ) : null}
          <h1 className="store-heading mt-2 text-3xl font-semibold leading-tight">{product.title}</h1>

          {reviewApp ? (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-xs store-muted">
              <Stars rating={averageRating} />
              {reviews.length > 0
                ? `${averageRating.toFixed(1)} · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
                : "No reviews yet"}
            </a>
          ) : null}

          <p className="mt-4 text-sm leading-relaxed store-muted">
            {product.description || "Details coming soon."}
          </p>

          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/s/${shop.slug}/search?q=${encodeURIComponent(tag)}`}
                  className="rounded-full border px-2.5 py-0.5 text-[11px] store-muted store-border"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-6 border-t pt-6 store-divider">
            {soldOut ? (
              <p className="mb-3 text-sm font-medium text-red-600">Sold out</p>
            ) : null}
            <ProductPurchase
              slug={shop.slug}
              product={{
                id: product.id,
                title: product.title,
                handle: product.handle,
                image: product.image
              }}
              variants={product.variants.map((variant) => ({
                id: variant.id,
                title: variant.title,
                price: variant.price,
                compareAtPrice: variant.compareAtPrice,
                inventoryQty: variant.inventoryQty,
                trackInventory: variant.trackInventory,
                sku: variant.sku
              }))}
            />
            {wishlistApp ? (
              <div className="mt-3">
                <WishlistButton
                  product={{
                    handle: product.handle,
                    title: product.title,
                    vendor: product.vendor,
                    image: product.image,
                    minPrice
                  }}
                  withLabel
                  className="w-full sm:w-auto"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-6 space-y-2 border-t pt-5 text-xs store-muted store-divider">
            <p className="flex items-center gap-2">
              <Icon name="truck" className="h-4 w-4" />
              Ships within 1–2 business days.
            </p>
            <p className="flex items-center gap-2">
              <Icon name="check" className="h-4 w-4" />
              30-day returns on unused items.
            </p>
            {settings.taxRatePct > 0 ? (
              <p>Sales tax of {settings.taxRatePct}% calculated at checkout.</p>
            ) : null}
          </div>
        </div>
      </div>

      {reviewApp ? (
        <section id="reviews" className="mt-16 border-t pt-10 store-divider">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="store-heading text-2xl font-semibold">Customer reviews</h2>
              {reviews.length === 0 ? (
                <p className="mt-2 text-sm store-muted">No reviews yet — be the first.</p>
              ) : (
                <ul className="mt-5 space-y-5">
                  {reviews.map((review) => (
                    <li key={review.id} className="border-b pb-5 store-divider">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{review.author}</p>
                          <Stars rating={review.rating} className="mt-0.5" />
                        </div>
                        <span className="text-[11px] store-muted">{formatDate(review.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed store-muted">{review.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="store-card h-fit p-5">
              <h3 className="store-heading text-lg font-semibold">Write a review</h3>
              <p className="mb-4 mt-1 text-xs store-muted">Bought this? Tell the community what you think.</p>
              <ReviewForm slug={shop.slug} productId={product.id} />
            </div>
          </div>
        </section>
      ) : null}

      {recentlyViewedApp ? <RecentlyViewedRail slug={shop.slug} /> : null}

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="store-heading mb-5 text-2xl font-semibold">You may also like</h2>
          <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => {
              const itemMin = minVariantPrice(item.variants);
              return (
                <ProductCard
                  key={item.id}
                  slug={shop.slug}
                  showWishlist={wishlistApp}
                  product={{
                    handle: item.handle,
                    title: item.title,
                    vendor: item.vendor,
                    image: item.image,
                    minPrice: itemMin,
                    soldOut:
                      item.variants.length > 0 &&
                      item.variants.every((variant) => variant.trackInventory && variant.inventoryQty <= 0)
                  }}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
