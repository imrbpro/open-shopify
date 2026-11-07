import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { WishlistButton } from "./wishlist";

export type ProductCardData = {
  handle: string;
  title: string;
  vendor: string;
  image: string | null;
  minPrice: number;
  compareAtPrice?: number | null;
  soldOut?: boolean;
};

export function ProductCard({
  slug,
  product,
  showWishlist = false
}: {
  slug: string;
  product: ProductCardData;
  showWishlist?: boolean;
}) {
  return (
    <div className="group relative">
      {showWishlist ? (
        <div className="absolute right-3 top-3 z-10">
          <WishlistButton product={product} />
        </div>
      ) : null}
      <Link href={`/s/${slug}/products/${product.handle}`} className="block">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-xl border store-border"
        style={{ background: "var(--os-surface)" }}
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs store-muted">No image</div>
        )}
        {product.compareAtPrice && product.compareAtPrice > product.minPrice ? (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: "var(--os-primary)" }}
          >
            Sale
          </span>
        ) : null}
        {product.soldOut ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {product.vendor ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide store-muted">
              {product.vendor}
            </p>
          ) : null}
          <p className="truncate text-sm font-medium">{product.title}</p>
        </div>
        <div className="shrink-0 text-right text-sm">
          <span className="font-medium">{formatMoney(product.minPrice)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.minPrice ? (
            <span className="ml-1 text-xs line-through store-muted">
              {formatMoney(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
      </Link>
    </div>
  );
}
