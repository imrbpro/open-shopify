import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cancelPendingOrder } from "@/lib/orders";
import { verifyPaymentCancelToken } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");
  const token = url.searchParams.get("token");

  if (!orderId || !verifyPaymentCancelToken(orderId, token)) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shop: true }
  });
  if (!order) return NextResponse.redirect(new URL("/", request.url), 303);

  await cancelPendingOrder(order.id, "Payment was cancelled by the customer.");

  return NextResponse.redirect(
    new URL(`/s/${order.shop.slug}/thank-you/${order.number}?cancelled=1`, request.url),
    303
  );
}
