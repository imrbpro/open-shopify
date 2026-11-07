import type { Metadata } from "next";
import { getStore, isStoreOffline } from "@/lib/storefront";
import { themeCssVars } from "@/lib/theme";
import { CartProvider } from "@/components/store/cart-provider";
import { StoreFooter, StoreHeader } from "@/components/store/store-chrome";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { shop: string } }): Promise<Metadata> {
  const store = await getStore(params.shop);
  return {
    title: `${store.shop.name}`,
    description: store.shop.description ?? store.config.hero.subheading
  };
}

export default async function StoreLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { shop: string };
}) {
  const store = await getStore(params.shop);
  const style = themeCssVars(store.config) as React.CSSProperties;

  if (isStoreOffline(store)) {
    return (
      <div className="store-wrap flex min-h-screen items-center justify-center px-6" style={style}>
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border store-border">
            <Icon name="store" className="h-6 w-6" />
          </div>
          <h1 className="store-heading text-3xl font-semibold">{store.shop.name} is closed</h1>
          <p className="mt-3 text-sm store-muted">
            This storefront is temporarily unavailable because the subscription is inactive. If you
            are the owner, reactivate your plan from the admin billing page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="store-wrap" style={style}>
      <CartProvider slug={store.shop.slug}>
        <StoreHeader store={store} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <StoreFooter store={store} />
      </CartProvider>
    </div>
  );
}
