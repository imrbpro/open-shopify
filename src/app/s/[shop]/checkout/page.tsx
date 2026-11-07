import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStore } from "@/lib/storefront";
import { CheckoutForm } from "@/components/store/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: { shop: string } }) {
  const store = await getStore(params.shop);
  const rates = await prisma.shippingRate.findMany({
    where: { shopId: store.shop.id, active: true },
    orderBy: { price: "asc" }
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] store-muted">Secure checkout</p>
          <h1 className="store-heading mt-2 text-3xl font-semibold">Checkout</h1>
        </div>
        <Link href={`/s/${store.shop.slug}/cart`} className="text-xs font-medium underline store-muted">
          Return to cart
        </Link>
      </div>

      <CheckoutForm
        slug={store.shop.slug}
        currency={store.shop.currency}
        rates={rates.map((rate) => ({
          id: rate.id,
          name: rate.name,
          price: rate.price,
          minSubtotal: rate.minSubtotal
        }))}
        taxRatePct={store.settings.taxRatePct}
        taxShipping={store.settings.taxShipping}
        paymentProvider={store.settings.paymentProvider}
        paymentName={store.settings.customPaymentName || "External payment"}
        checkoutNote={store.settings.checkoutNote}
      />
    </div>
  );
}
