import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStore, isAppInstalled } from "@/lib/storefront";
import { minVariantPrice } from "@/lib/catalog";
import { formatDate } from "@/lib/utils";
import { ProductCard } from "@/components/store/product-card";
import { Icon } from "@/components/icons";
import { RecentlyViewedRail } from "@/components/store/wishlist";

export const dynamic = "force-dynamic";

export default async function StoreHomePage({ params }: { params: { shop: string } }) {
  const store = await getStore(params.shop);
  const { shop, config } = store;
  const wishlistApp = isAppInstalled(store, "wishlist");
  const recentlyViewedApp = isAppInstalled(store, "recently-viewed");

  const [products, collections, posts, rates] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: shop.id, status: "ACTIVE" },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.collection.findMany({
      where: { shopId: shop.id },
      include: { _count: { select: { products: true } } },
      take: 3,
      orderBy: { createdAt: "asc" }
    }),
    prisma.blogPost.findMany({
      where: { shopId: shop.id },
      orderBy: { publishedAt: "desc" },
      take: 3
    }),
    prisma.shippingRate.findMany({ where: { shopId: shop.id, active: true }, orderBy: { price: "asc" } })
  ]);

  const freeOver = rates.find((rate) => rate.minSubtotal > 0)?.minSubtotal ?? null;
  const cards = products.map((product) => {
    const minPrice = minVariantPrice(product.variants);
    const compareAt = product.variants
      .map((variant) => variant.compareAtPrice)
      .filter((value): value is number => value !== null && value > minPrice)
      .sort((a, b) => a - b)[0];
    return {
      handle: product.handle,
      title: product.title,
      vendor: product.vendor,
      image: product.image,
      minPrice,
      compareAtPrice: compareAt ?? null,
      soldOut:
        product.variants.length > 0 &&
        product.variants.every((variant) => variant.trackInventory && variant.inventoryQty <= 0)
    };
  });

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] store-muted">
            {shop.description ? "Welcome" : "New season"}
          </p>
          <h1 className="store-heading mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            {config.hero.heading}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed store-muted">{config.hero.subheading}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/s/${shop.slug}/collections/all`} className="store-btn">
              {config.hero.ctaLabel}
            </Link>
            <Link href={`/s/${shop.slug}/pages/about`} className="store-btn-outline">
              Our story
            </Link>
          </div>
          {freeOver ? (
            <p className="mt-5 flex items-center gap-2 text-xs store-muted">
              <Icon name="truck" className="h-4 w-4" />
              Free shipping on orders over {(freeOver / 100).toLocaleString("en-US", {
                style: "currency",
                currency: shop.currency,
                minimumFractionDigits: 0
              })}
            </p>
          ) : null}
        </div>
        <div className="relative">
          {config.hero.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.hero.image}
              alt={config.hero.heading}
              className="aspect-[4/3] w-full rounded-2xl border object-cover store-border"
            />
          ) : (
            <div className="aspect-[4/3] w-full rounded-2xl border store-border" style={{ background: "var(--os-surface)" }} />
          )}
        </div>
      </section>

      {collections.length > 0 ? (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="store-heading text-2xl font-semibold">Shop by collection</h2>
              <p className="text-sm store-muted">Curated edits from the workshop.</p>
            </div>
            <Link href={`/s/${shop.slug}/collections/all`} className="text-sm font-medium underline">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/s/${shop.slug}/collections/${collection.handle}`}
                className="group relative overflow-hidden rounded-xl border store-border"
              >
                <div className="aspect-[16/10]" style={{ background: "var(--os-surface)" }}>
                  {collection.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4">
                  <div className="text-white">
                    <p className="text-base font-semibold">{collection.title}</p>
                    <p className="text-xs text-white/80">
                      {collection._count.products} product{collection._count.products === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="store-heading text-2xl font-semibold">New arrivals</h2>
            <p className="text-sm store-muted">Freshly added to the shelves.</p>
          </div>
          <Link href={`/s/${shop.slug}/collections/all`} className="text-sm font-medium underline">
            Shop all
          </Link>
        </div>
        <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((product) => (
            <ProductCard
              key={product.handle}
              slug={shop.slug}
              product={product}
              showWishlist={wishlistApp}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border p-8 sm:grid-cols-3 store-border" style={{ background: "var(--os-surface)" }}>
        <div>
          <Icon name="truck" className="h-5 w-5" />
          <p className="mt-3 text-sm font-semibold">Fast, careful shipping</p>
          <p className="mt-1 text-xs store-muted">
            {freeOver ? "Free shipping on qualifying orders." : "Flat-rate shipping at checkout."}
          </p>
        </div>
        <div>
          <Icon name="check" className="h-5 w-5" />
          <p className="mt-3 text-sm font-semibold">30-day returns</p>
          <p className="mt-1 text-xs store-muted">Changed your mind? Send it back, no questions.</p>
        </div>
        <div>
          <Icon name="globe" className="h-5 w-5" />
          <p className="mt-3 text-sm font-semibold">Responsibly made</p>
          <p className="mt-1 text-xs store-muted">Small-batch production with low-waste materials.</p>
        </div>
      </section>

      {posts.length > 0 ? (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="store-heading text-2xl font-semibold">From the journal</h2>
              <p className="text-sm store-muted">Notes on craft, materials and slow living.</p>
            </div>
            <Link href={`/s/${shop.slug}/blog`} className="text-sm font-medium underline">
              All stories
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/s/${shop.slug}/blog/${post.handle}`} className="group">
                <div className="aspect-[16/10] overflow-hidden rounded-xl border store-border" style={{ background: "var(--os-surface)" }}>
                  {post.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide store-muted">
                  {formatDate(post.publishedAt)}
                </p>
                <p className="mt-1 text-sm font-medium">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-xs store-muted">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recentlyViewedApp ? <RecentlyViewedRail slug={shop.slug} /> : null}
    </div>
  );
}
