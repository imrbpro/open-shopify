import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

  return NextResponse.redirect(
    new URL(`/s/${order.shop.slug}/thank-you/${order.number}`, request.url),
    303
  );
}
