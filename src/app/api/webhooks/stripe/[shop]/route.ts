import { prisma } from "@/lib/db";
import { getShopSettings } from "@/lib/settings";
import { cancelPendingOrder, markOrderPaid } from "@/lib/orders";
import { verifyStripeSignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

type StripeEvent = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      payment_status?: string;
      metadata?: { orderId?: string };
      client_reference_id?: string;
    };
  };
};

export async function POST(
  request: Request,
  { params }: { params: { shop: string } }
): Promise<Response> {
  const shop = await prisma.shop.findUnique({ where: { slug: params.shop } });
  if (!shop) return Response.json({ error: "Store not found." }, { status: 404 });

  const settings = await getShopSettings(shop.id);
  if (!settings.stripeWebhookSecret) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (
    !verifyStripeSignature({
      payload,
      signatureHeader: signature,
      secret: settings.stripeWebhookSecret
    })
  ) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const object = event.data?.object;
  const orderId = object?.metadata?.orderId ?? object?.client_reference_id ?? null;

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (orderId && object?.payment_status === "paid") {
      const order = await prisma.order.findFirst({ where: { id: orderId, shopId: shop.id } });
      if (order) {
        await markOrderPaid(order.id, {
          paymentRef: object.id ?? orderId,
          message: "Payment captured via Stripe webhook."
        });
      }
    }
  }

  if (event.type === "checkout.session.expired" && orderId) {
    const order = await prisma.order.findFirst({ where: { id: orderId, shopId: shop.id } });
    if (order) await cancelPendingOrder(order.id, "Stripe Checkout session expired.");
  }

  return Response.json({ received: true });
}
