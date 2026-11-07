import type { Metadata } from "next";
import { getStore } from "@/lib/storefront";
import { themeCssVars } from "@/lib/theme";
import { CartProvider } from "@/components/store/cart-provider";
import { DiscoveryProvider } from "@/components/store/discovery-provider";
import { StoreFooter, StoreHeader } from "@/components/store/store-chrome";
import { StoreAnalytics } from "@/components/store/analytics";

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

  return (
    <div className="store-wrap" style={style}>
      <CartProvider slug={store.shop.slug}>
        <DiscoveryProvider slug={store.shop.slug}>
          <StoreHeader store={store} />
          <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          <StoreFooter store={store} />
        </DiscoveryProvider>
      </CartProvider>
      <StoreAnalytics settings={store.settings} />
    </div>
  );
}
