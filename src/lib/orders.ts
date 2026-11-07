import { prisma } from "./db";
import { getShopSettings } from "./settings";
import { queueEmail } from "./email";
import { dispatchWebhooks } from "./webhooks";
import { formatMoney } from "./money";
import { renderTemplate } from "./utils";

type OrderResult =
  | { ok: true; already: boolean }
  | { ok: false; error: string };

export async function markOrderPaid(
  orderId: string,
  options: { paymentRef?: string; message?: string } = {}
): Promise<OrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shop: true, customer: true }
  });
  if (!order) return { ok: false, error: "Order not found." };
  if (["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(order.financialStatus)) {
    return { ok: true, already: true };
  }
  if (order.financialStatus === "CANCELLED") {
    return { ok: false, error: "Order is cancelled." };
  }

  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, financialStatus: { in: ["PENDING", "AUTHORIZED"] } },
      data: {
        financialStatus: "PAID",
        paymentRef: options.paymentRef ?? order.paymentRef
      }
    });
    if (result.count === 0) return false;

    if (order.customerId) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: { totalSpent: { increment: order.total } }
      });
    }
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "payment_captured",
        message: options.message ?? `Payment of ${formatMoney(order.total, order.currency)} captured.`
      }
    });
    return true;
  });

  if (!claimed) return { ok: true, already: true };

  const settings = await getShopSettings(order.shopId);
  const customerName =
    `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim() || order.email;
  try {
    await queueEmail({
      shopId: order.shopId,
      to: order.email,
      subject: renderTemplate(settings.orderConfirmationSubject, {
        customer_name: customerName,
        order_number: `#${order.number}`,
        total: formatMoney(order.total, order.currency),
        shop_name: order.shop.name,
        tracking_number: "",
        tracking_company: ""
      }),
      body: renderTemplate(settings.orderConfirmationBody, {
        customer_name: customerName,
        order_number: `#${order.number}`,
        total: formatMoney(order.total, order.currency),
        shop_name: order.shop.name,
        tracking_number: "",
        tracking_company: ""
      }),
      kind: "order_confirmation"
    });
  } catch {
    // Email delivery is best effort and must not fail payment processing.
  }

  await dispatchWebhooks(order.shop.slug, order.shopId, "orders/paid", {
    order: {
      number: order.number,
      email: order.email,
      total: order.total,
      currency: order.currency
    }
  }).catch(() => undefined);

  await prisma.event
    .create({
      data: {
        shopId: order.shopId,
        name: "order_completed",
        value: order.total,
        dataJson: JSON.stringify({
          number: order.number,
          email: order.email,
          paymentMethod: order.paymentMethod
        })
      }
    })
    .catch(() => undefined);

  return { ok: true, already: false };
}

export async function cancelPendingOrder(
  orderId: string,
  reason = "Payment was cancelled before it completed."
): Promise<OrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shop: true, items: true, customer: true }
  });
  if (!order) return { ok: false, error: "Order not found." };
  if (order.financialStatus === "CANCELLED") return { ok: true, already: true };
  if (!["PENDING", "AUTHORIZED"].includes(order.financialStatus)) {
    return { ok: false, error: "Only unpaid orders can be cancelled here." };
  }

  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, financialStatus: { in: ["PENDING", "AUTHORIZED"] } },
      data: { financialStatus: "CANCELLED" }
    });
    if (result.count === 0) return false;

    for (const item of order.items) {
      if (!item.variantId) continue;
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
      if (!variant || !variant.trackInventory) continue;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { inventoryQty: { increment: item.quantity } }
      });
    }

    if (order.discountCode) {
      const discount = await tx.discount.findUnique({
        where: { shopId_code: { shopId: order.shopId, code: order.discountCode } }
      });
      if (discount) {
        await tx.discount.update({
          where: { id: discount.id },
          data: { usedCount: Math.max(0, discount.usedCount - 1) }
        });
      }
    }

    if (order.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: order.customerId } });
      if (customer) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { ordersCount: Math.max(0, customer.ordersCount - 1) }
        });
      }
    }

    await tx.orderEvent.create({
      data: { orderId: order.id, type: "cancelled", message: reason }
    });
    return true;
  });

  if (!claimed) return { ok: true, already: true };

  await dispatchWebhooks(order.shop.slug, order.shopId, "orders/cancelled", {
    order: { number: order.number, email: order.email }
  }).catch(() => undefined);

  return { ok: true, already: false };
}
