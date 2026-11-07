"use server";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { getShopSettings } from "@/lib/settings";
import { formatMoney, parseMoneyToCents } from "@/lib/money";
import { renderTemplate } from "@/lib/utils";
import { queueEmail } from "@/lib/email";
import { dispatchWebhooks } from "@/lib/webhooks";
import { cancelPendingOrder, markOrderPaid as markPaid } from "@/lib/orders";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function loadOrder(shopId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, shopId },
    include: { items: true, customer: true, refunds: true }
  });
  if (!order) notFound();
  return order;
}

export async function markOrderPaid(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const order = await loadOrder(shop.id, text(formData, "id"));
  const redirectBase = `/admin/${shop.slug}/orders/${order.id}`;

  const result = await markPaid(order.id, { message: "Payment marked as paid (manual capture)." });
  if (!result.ok) {
    redirect(`${redirectBase}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(redirectBase);
}

export async function fulfillOrder(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const order = await loadOrder(shop.id, text(formData, "id"));
  const redirectBase = `/admin/${shop.slug}/orders/${order.id}`;

  const trackingCompany = text(formData, "trackingCompany") || null;
  const trackingNumber = text(formData, "trackingNumber") || null;
  const notify = formData.get("notify") === "on";

  await prisma.$transaction(async (tx) => {
    await tx.fulfillment.create({
      data: { orderId: order.id, trackingCompany, trackingNumber }
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: "FULFILLED",
        timeline: {
          create: {
            type: "fulfilled",
            message: `Order fulfilled${trackingNumber ? ` with ${trackingCompany ?? "carrier"} tracking ${trackingNumber}` : ""}.`
          }
        }
      }
    });
  });

  if (notify) {
    const settings = await getShopSettings(shop.id);
    const vars = {
      customer_name: `${order.customer?.firstName ?? ""} ${order.customer?.lastName ?? ""}`.trim() || order.email,
      order_number: `#${order.number}`,
      shop_name: shop.name,
      tracking_number: trackingNumber ?? "—",
      tracking_company: trackingCompany ?? "—"
    };
    await queueEmail({
      shopId: shop.id,
      to: order.email,
      subject: renderTemplate(settings.shippingEmailSubject, vars),
      body: renderTemplate(settings.shippingEmailBody, vars),
      kind: "shipping_update"
    });
  }

  await dispatchWebhooks(shop.slug, shop.id, "orders/fulfilled", {
    id: order.id,
    number: order.number,
    trackingCompany,
    trackingNumber
  });

  redirect(redirectBase);
}

export async function refundOrder(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const order = await loadOrder(shop.id, text(formData, "id"));
  const redirectBase = `/admin/${shop.slug}/orders/${order.id}`;

  const amount = parseMoneyToCents(text(formData, "amount"));
  if (amount === null || amount <= 0) {
    redirect(`${redirectBase}?error=${encodeURIComponent("Enter a refund amount greater than zero.")}`);
  }
  const alreadyRefunded = order.refunds.reduce((sum, refund) => sum + refund.amount, 0);
  const remaining = order.total - alreadyRefunded;
  if (amount > remaining) {
    redirect(
      `${redirectBase}?error=${encodeURIComponent("Refund exceeds the remaining refundable balance.")}`
    );
  }

  const reason = text(formData, "reason") || "Customer request";
  const note = text(formData, "note");
  const newTotalRefunded = alreadyRefunded + amount;
  const financialStatus = newTotalRefunded >= order.total ? "REFUNDED" : "PARTIALLY_REFUNDED";

  await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: { orderId: order.id, amount, reason, note: note || null }
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        financialStatus,
        timeline: {
          create: {
            type: "refunded",
            message: `Refund of ${formatMoney(amount, order.currency)} issued (${reason}).`
          }
        }
      }
    });
  });

  await dispatchWebhooks(shop.slug, shop.id, "orders/refunded", {
    id: order.id,
    number: order.number,
    amount,
    currency: order.currency
  });

  redirect(redirectBase);
}

export async function cancelOrder(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const order = await loadOrder(shop.id, text(formData, "id"));
  const redirectBase = `/admin/${shop.slug}/orders/${order.id}`;

  if (order.fulfillmentStatus === "FULFILLED") {
    redirect(
      `${redirectBase}?error=${encodeURIComponent("Fulfilled orders cannot be cancelled. Refund instead.")}`
    );
  }
  if (!["PENDING", "AUTHORIZED"].includes(order.financialStatus)) {
    redirect(
      `${redirectBase}?error=${encodeURIComponent("Only unpaid orders can be cancelled. Refund a paid order instead.")}`
    );
  }

  const result = await cancelPendingOrder(order.id, "Order cancelled by merchant; inventory restocked.");
  if (!result.ok) {
    redirect(`${redirectBase}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(redirectBase);
}

export async function addOrderNote(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const order = await loadOrder(shop.id, text(formData, "id"));
  const message = text(formData, "message");
  if (!message) redirect(`/admin/${shop.slug}/orders/${order.id}`);

  await prisma.order.update({
    where: { id: order.id },
    data: { timeline: { create: { type: "note", message } } }
  });

  redirect(`/admin/${shop.slug}/orders/${order.id}`);
}

export async function saveOrderNote(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const order = await loadOrder(shop.id, text(formData, "id"));
  await prisma.order.update({
    where: { id: order.id },
    data: { note: text(formData, "note") || null }
  });
  redirect(`/admin/${shop.slug}/orders/${order.id}?saved=1`);
}
