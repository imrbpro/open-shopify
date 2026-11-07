"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import {
  computeDiscountAmount,
  computeTotals,
  isFreeShippingDiscount,
  validateDiscountCode
} from "@/lib/discounts";
import { getShopSettings } from "@/lib/settings";
import { queueEmail } from "@/lib/email";
import { dispatchWebhooks } from "@/lib/webhooks";
import { renderTemplate } from "@/lib/utils";
import type { CheckoutState, DiscountPreview, FormState } from "@/lib/types";

const EVENT_NAMES = new Set([
  "product_viewed",
  "checkout_started",
  "order_completed",
  "search",
  "newsletter_signup"
]);

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function trackStoreEvent(
  shopSlug: string,
  name: string,
  data: Record<string, unknown> = {},
  value?: number
): Promise<void> {
  if (!EVENT_NAMES.has(name)) return;
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return;
  const dataJson = JSON.stringify(data).slice(0, 2000);
  await prisma.event.create({
    data: {
      shopId: shop.id,
      name,
      dataJson,
      value: typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null
    }
  });
}

export async function previewDiscount(
  shopSlug: string,
  code: string,
  subtotal: number
): Promise<DiscountPreview> {
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return { ok: false, error: "Store not found." };
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Enter a discount code." };
  const discount = await prisma.discount.findUnique({
    where: { shopId_code: { shopId: shop.id, code: normalized } }
  });
  const validation = validateDiscountCode(discount, Math.max(0, Math.round(subtotal)));
  if (!validation.ok || !discount) return { ok: false, error: validation.ok ? "Invalid code." : validation.error };
  return {
    ok: true,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    amount: computeDiscountAmount(discount, Math.round(subtotal)),
    freeShipping: isFreeShippingDiscount(discount)
  };
}

export async function subscribeNewsletter(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const shopSlug = text(formData, "shopSlug");
  const email = text(formData, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug }, select: { id: true } });
  if (!shop) return { error: "Store not found." };
  const settings = await getShopSettings(shop.id);
  if (!settings.newsletterEnabled) return { error: "Newsletter signup is disabled." };

  const existing = await prisma.customer.findUnique({
    where: { shopId_email: { shopId: shop.id, email } }
  });
  if (existing) {
    await prisma.customer.update({ where: { id: existing.id }, data: { marketingOptIn: true } });
  } else {
    await prisma.customer.create({
      data: { shopId: shop.id, email, marketingOptIn: true }
    });
  }
  await prisma.event.create({
    data: { shopId: shop.id, name: "newsletter_signup", dataJson: JSON.stringify({ email }) }
  });
  return { success: "You're on the list. Welcome aboard!" };
}

export async function submitReview(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const shopSlug = text(formData, "shopSlug");
  const productId = text(formData, "productId");
  const author = text(formData, "author");
  const body = text(formData, "body");
  const rating = Number(text(formData, "rating"));

  if (!author) return { error: "Please add your name." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Choose a rating between 1 and 5 stars." };
  }
  if (body.length < 4) return { error: "Tell us a little more about the product." };

  const product = await prisma.product.findFirst({
    where: { id: productId, shop: { slug: shopSlug } },
    select: { id: true, shopId: true, handle: true }
  });
  if (!product) return { error: "Product not found." };

  await prisma.review.create({
    data: {
      shopId: product.shopId,
      productId: product.id,
      author: author.slice(0, 80),
      rating,
      body: body.slice(0, 2000),
      status: "APPROVED"
    }
  });
  revalidatePath(`/s/${shopSlug}/products/${product.handle}`);
  return { success: "Thanks for your review!" };
}

export async function placeOrder(
  _prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const shopSlug = text(formData, "shopSlug");
  const shop = await prisma.shop.findUnique({
    where: { slug: shopSlug },
    include: { subscription: true }
  });
  if (!shop) return { error: "Store not found." };
  if (shop.subscription?.status === "CANCELLED") {
    return { error: "This store is not accepting orders right now." };
  }

  let requested: { variantId: string; quantity: number }[] = [];
  try {
    const parsed = JSON.parse(text(formData, "items") || "[]");
    if (!Array.isArray(parsed)) throw new Error("bad cart");
    requested = parsed
      .filter(
        (line): line is { variantId: string; quantity: number } =>
          line && typeof line.variantId === "string" && Number.isFinite(Number(line.quantity))
      )
      .map((line) => ({
        variantId: line.variantId,
        quantity: Math.max(1, Math.min(99, Math.floor(Number(line.quantity))))
      }));
  } catch {
    return { error: "Your cart could not be read. Please refresh and try again." };
  }
  if (requested.length === 0) return { error: "Your cart is empty." };

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: requested.map((line) => line.variantId) },
      product: { shopId: shop.id, status: "ACTIVE" }
    },
    include: { product: true }
  });
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  const lines: {
    variant: (typeof variants)[number];
    quantity: number;
  }[] = [];
  for (const line of requested) {
    const variant = variantById.get(line.variantId);
    if (!variant) return { error: "One of your items is no longer available." };
    if (variant.trackInventory && variant.inventoryQty < line.quantity) {
      return {
        error:
          variant.inventoryQty <= 0
            ? `${variant.product.title} is sold out.`
            : `Only ${variant.inventoryQty} of ${variant.product.title} left in stock.`
      };
    }
    lines.push({ variant, quantity: line.quantity });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.variant.price * line.quantity, 0);

  const email = text(formData, "email").toLowerCase();
  const firstName = text(formData, "firstName");
  const lastName = text(formData, "lastName");
  const address1 = text(formData, "address1");
  const address2 = text(formData, "address2");
  const city = text(formData, "city");
  const province = text(formData, "province");
  const zip = text(formData, "zip");
  const country = text(formData, "country") || "US";
  const phone = text(formData, "phone");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!firstName) return { error: "Enter your first name." };
  if (!address1) return { error: "Enter a shipping address." };
  if (!city) return { error: "Enter a city." };
  if (!zip) return { error: "Enter a ZIP or postal code." };

  const settings = await getShopSettings(shop.id);
  const paymentEnabled = settings.cardPayment ? "card" : settings.manualPayment ? "manual" : null;
  if (!paymentEnabled) return { error: "Checkout is not configured to accept payments." };
  const requestedPayment = text(formData, "paymentMethod");
  const paymentMethod =
    requestedPayment === "card" && settings.cardPayment
      ? "card"
      : requestedPayment === "manual" && settings.manualPayment
        ? "manual"
        : paymentEnabled;

  const code = text(formData, "discountCode").toUpperCase();
  const discount = code
    ? await prisma.discount.findUnique({ where: { shopId_code: { shopId: shop.id, code } } })
    : null;
  if (code && !discount) return { error: "That discount code is not valid." };
  if (discount) {
    const validation = validateDiscountCode(discount, subtotal);
    if (!validation.ok) return { error: validation.error };
    if (discount.oncePerCustomer) {
      const previous = await prisma.order.count({
        where: { shopId: shop.id, email, discountCode: discount.code }
      });
      if (previous > 0) return { error: "This discount can only be used once per customer." };
    }
  }
  const discountAmount = discount ? computeDiscountAmount(discount, subtotal) : 0;
  const freeShipping = isFreeShippingDiscount(discount);

  const shippingRateId = text(formData, "shippingRateId");
  const shippingRate = shippingRateId
    ? await prisma.shippingRate.findFirst({
        where: { id: shippingRateId, shopId: shop.id, active: true }
      })
    : await prisma.shippingRate.findFirst({
        where: { shopId: shop.id, active: true },
        orderBy: { price: "asc" }
      });
  let shipping = shippingRate ? shippingRate.price : 0;
  if (shippingRate && shippingRate.minSubtotal > 0 && subtotal >= shippingRate.minSubtotal) {
    shipping = 0;
  }

  const totals = computeTotals({
    subtotal,
    discountAmount,
    freeShipping,
    shipping,
    taxRatePct: settings.taxRatePct,
    taxShipping: settings.taxShipping
  });

  const fullName = `${firstName} ${lastName}`.trim();
  let customer = await prisma.customer.findUnique({
    where: { shopId_email: { shopId: shop.id, email } }
  });
  let isNewCustomer = false;
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        shopId: shop.id,
        email,
        firstName,
        lastName,
        phone: phone || null
      }
    });
    isNewCustomer = true;
  } else {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: customer.firstName || firstName,
        lastName: customer.lastName || lastName,
        phone: customer.phone ?? (phone || null)
      }
    });
  }

  const existingAddresses = await prisma.address.count({ where: { customerId: customer.id } });
  await prisma.address.create({
    data: {
      customerId: customer.id,
      name: fullName,
      line1: address1,
      line2: address2 || null,
      city,
      province: province || null,
      zip,
      country,
      phone: phone || null,
      isDefault: existingAddresses === 0
    }
  });

  const lastOrder = await prisma.order.findFirst({
    where: { shopId: shop.id },
    orderBy: { number: "desc" },
    select: { number: true }
  });
  const orderNumber = (lastOrder?.number ?? 1000) + 1;
  const financialStatus = paymentMethod === "card" ? "PAID" : "PENDING";
  const shippingAddressJson = JSON.stringify({
    name: fullName,
    company: "",
    line1: address1,
    line2: address2,
    city,
    province,
    zip,
    country,
    phone
  });

  const order = await prisma.order.create({
    data: {
      shopId: shop.id,
      number: orderNumber,
      customerId: customer.id,
      email,
      financialStatus,
      fulfillmentStatus: "UNFULFILLED",
      currency: shop.currency,
      subtotal: totals.subtotal,
      shippingTotal: totals.shippingTotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      discountCode: discount?.code ?? null,
      shippingMethod: shippingRate?.name ?? "Free shipping",
      paymentMethod: paymentMethod === "card" ? "Card (simulated)" : "Manual payment",
      shippingAddressJson,
      items: {
        create: lines.map((line) => ({
          productId: line.variant.productId,
          variantId: line.variant.id,
          title: line.variant.product.title,
          variantTitle: line.variant.title,
          sku: line.variant.sku,
          image: line.variant.product.image,
          price: line.variant.price,
          quantity: line.quantity,
          total: line.variant.price * line.quantity
        }))
      },
      timeline: {
        create: [
          { type: "placed", message: `Order placed by ${fullName}.` },
          {
            type: "payment",
            message:
              financialStatus === "PAID"
                ? "Payment captured via simulated card gateway."
                : "Awaiting manual payment."
          }
        ]
      }
    }
  });

  for (const line of lines) {
    if (line.variant.trackInventory) {
      await prisma.productVariant.update({
        where: { id: line.variant.id },
        data: { inventoryQty: Math.max(0, line.variant.inventoryQty - line.quantity) }
      });
    }
  }

  if (discount) {
    await prisma.discount.update({
      where: { id: discount.id },
      data: { usedCount: { increment: 1 } }
    });
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      ordersCount: { increment: 1 },
      totalSpent: { increment: totals.total }
    }
  });

  await prisma.event.create({
    data: {
      shopId: shop.id,
      name: "order_completed",
      value: totals.total,
      dataJson: JSON.stringify({ number: orderNumber, email, paymentMethod })
    }
  });

  const templateVars: Record<string, string> = {
    customer_name: fullName || email,
    order_number: `#${orderNumber}`,
    total: formatMoney(totals.total, shop.currency),
    shop_name: shop.name,
    tracking_number: "",
    tracking_company: ""
  };
  await queueEmail({
    shopId: shop.id,
    to: email,
    subject: renderTemplate(settings.orderConfirmationSubject, templateVars),
    body: renderTemplate(settings.orderConfirmationBody, templateVars),
    kind: "order_confirmation"
  });

  await dispatchWebhooks(shop.slug, shop.id, "orders/create", {
    order: { number: orderNumber, email, total: totals.total, currency: shop.currency }
  });
  if (financialStatus === "PAID") {
    await dispatchWebhooks(shop.slug, shop.id, "orders/paid", {
      order: { number: orderNumber, email, total: totals.total, currency: shop.currency }
    });
  }
  if (isNewCustomer) {
    await dispatchWebhooks(shop.slug, shop.id, "customers/create", {
      customer: { email, name: fullName }
    });
  }

  return { orderNumber };
}
