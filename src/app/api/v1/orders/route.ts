import { prisma } from "@/lib/db";
import { authenticateApiRequest, hasScope, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const context = await authenticateApiRequest(request);
  if (!context) return unauthorized();
  if (!hasScope(context.key, "read_orders")) {
    return Response.json({ errors: "Missing read_orders scope." }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(250, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const status = url.searchParams.get("status")?.toUpperCase();
  const financialStatuses = [
    "PENDING",
    "AUTHORIZED",
    "PAID",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
    "VOIDED",
    "CANCELLED"
  ];

  const orders = await prisma.order.findMany({
    where: {
      shopId: context.shop.id,
      ...(status && financialStatuses.includes(status) ? { financialStatus: status } : {})
    },
    include: {
      items: true,
      customer: true,
      refunds: true
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return Response.json({
    orders: orders.map((order) => ({
      id: order.id,
      number: order.number,
      email: order.email,
      financial_status: order.financialStatus,
      fulfillment_status: order.fulfillmentStatus,
      currency: order.currency,
      subtotal: order.subtotal,
      shipping_total: order.shippingTotal,
      tax_total: order.taxTotal,
      discount_total: order.discountTotal,
      total: order.total,
      discount_code: order.discountCode,
      shipping_method: order.shippingMethod,
      payment_method: order.paymentMethod,
      created_at: order.createdAt,
      customer: order.customer
        ? {
            id: order.customer.id,
            email: order.customer.email,
            first_name: order.customer.firstName,
            last_name: order.customer.lastName
          }
        : null,
      items: order.items.map((item) => ({
        title: item.title,
        variant_title: item.variantTitle,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        total: item.total
      })),
      refunds: order.refunds.map((refund) => ({ amount: refund.amount, created_at: refund.createdAt }))
    }))
  });
}
