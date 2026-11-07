import { notFound } from "next/navigation";
import { getStore, isAppInstalled } from "@/lib/storefront";
import { WishlistView } from "@/components/store/wishlist";

export const dynamic = "force-dynamic";

export default async function WishlistPage({ params }: { params: { shop: string } }) {
  const store = await getStore(params.shop);
  if (!isAppInstalled(store, "wishlist")) notFound();

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] store-muted">Saved for later</p>
        <h1 className="store-heading mt-1 text-3xl font-semibold">Wishlist</h1>
      </div>
      <WishlistView slug={store.shop.slug} />
    </div>
  );
}
