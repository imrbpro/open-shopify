import { getStore } from "@/lib/storefront";
import { CartView } from "@/components/store/cart-view";

export const dynamic = "force-dynamic";

export default async function CartPage({ params }: { params: { shop: string } }) {
  const store = await getStore(params.shop);
  return (
    <div>
      <h1 className="store-heading mb-8 text-3xl font-semibold">Your cart</h1>
      <CartView slug={store.shop.slug} currency={store.shop.currency} />
    </div>
  );
}
