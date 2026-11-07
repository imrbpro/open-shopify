import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShopSettings } from "@/lib/settings";
import { markOrderPaid } from "@/lib/orders";
import { retrieveStripeSession } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const shopSlug = url.searchParams.get("shop");

  if (!sessionId || !shopSlug) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.redirect(new URL("/", request.url), 303);

  const settings = await getShopSettings(shop.id);
  if (!settings.stripeSecretKey) {
    return NextResponse.redirect(new URL(`/s/${shop.slug}`, request.url), 303);
  }

  const session = await retrieveStripeSession(sessionId, settings.stripeSecretKey);
  if (!session.ok || !session.orderId) {
    return NextResponse.redirect(new URL(`/s/${shop.slug}?payment=error`, request.url), 303);
  }

  const order = await prisma.order.findFirst({
    where: { id: session.orderId, shopId: shop.id },
    select: { id: true, number: true }
  });
  if (!order) return NextResponse.redirect(new URL(`/s/${shop.slug}`, request.url), 303);

  if (session.paymentStatus === "paid") {
    await markOrderPaid(order.id, {
      paymentRef: sessionId,
      message: "Payment captured via Stripe Checkout."
    });
  }

  return NextResponse.redirect(
    new URL(`/s/${shop.slug}/thank-you/${order.number}`, request.url),
    303
  );
}
