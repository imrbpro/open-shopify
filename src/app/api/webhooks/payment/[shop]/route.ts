import { prisma } from "@/lib/db";
import { getShopSettings } from "@/lib/settings";
import { cancelPendingOrder, markOrderPaid } from "@/lib/orders";
import { verifySignedPayload } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { shop: string } }
): Promise<Response> {
  const shop = await prisma.shop.findUnique({ where: { slug: params.shop } });
  if (!shop) return Response.json({ error: "Store not found." }, { status: 404 });

  const settings = await getShopSettings(shop.id);
  if (!settings.customPaymentSecret) {
    return Response.json({ error: "Payment webhook is not configured." }, { status: 400 });
  }

  const payload = await request.text();
  const signature = request.headers.get("x-openstore-signature");
  if (!verifySignedPayload(payload, signature, settings.customPaymentSecret)) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  let body: { orderId?: string; status?: string };
  try {
    body = JSON.parse(payload) as { orderId?: string; status?: string };
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.orderId) return Response.json({ error: "orderId is required." }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: body.orderId, shopId: shop.id },
    select: { id: true }
  });
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

  const status = (body.status ?? "").toLowerCase();
  if (["paid", "succeeded", "completed"].includes(status)) {
    await markOrderPaid(order.id, {
      message: "Payment confirmed by the external payment provider."
    });
  } else if (["cancelled", "canceled", "failed", "expired"].includes(status)) {
    await cancelPendingOrder(order.id, "Payment was not completed with the external provider.");
  }

  return Response.json({ received: true });
}
