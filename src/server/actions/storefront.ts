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
import { cancelPendingOrder, markOrderPaid } from "@/lib/orders";
import { absoluteUrl, getBaseUrl } from "@/lib/url";
import {
  buildCustomPaymentUrl,
  createStripeCheckoutSession,
  paymentCancelToken
} from "@/lib/payments";
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
  const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return { error: "Store not found." };

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
  const provider = settings.paymentProvider;
  if (provider === "stripe" && !settings.stripeSecretKey) {
    return { error: "Card payments are not configured yet. Choose another payment method or contact the store." };
  }
  if (provider === "custom" && (!settings.customPaymentUrl || !settings.customPaymentSecret)) {
    return { error: "The external payment provider is not configured yet. Please contact the store." };
  }
  const paymentLabel =
    provider === "simulated"
      ? "Card (simulated)"
      : provider === "manual"
        ? "Manual payment"
        : provider === "stripe"
          ? "Stripe Checkout"
          : settings.customPaymentName || "External payment";

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
      financialStatus: "PENDING",
      fulfillmentStatus: "UNFULFILLED",
      currency: shop.currency,
      subtotal: totals.subtotal,
      shippingTotal: totals.shippingTotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      discountCode: discount?.code ?? null,
      shippingMethod: shippingRate?.name ?? "Free shipping",
      paymentMethod: paymentLabel,
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
          { type: "payment", message: `Awaiting payment via ${paymentLabel}.` }
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
    data: { ordersCount: { increment: 1 } }
  });

  await dispatchWebhooks(shop.slug, shop.id, "orders/create", {
    order: { number: orderNumber, email, total: totals.total, currency: shop.currency }
  });
  if (isNewCustomer) {
    await dispatchWebhooks(shop.slug, shop.id, "customers/create", {
      customer: { email, name: fullName }
    });
  }

  if (provider === "simulated") {
    const paid = await markOrderPaid(order.id, {
      paymentRef: "simulated",
      message: "Payment captured via simulated card gateway."
    });
    if (!paid.ok) return { error: paid.error };
    return { orderNumber };
  }

  if (provider === "manual") {
    await queueEmail({
      shopId: shop.id,
      to: email,
      subject: `Payment instructions for order #${orderNumber} — ${shop.name}`,
      body: `Hi ${fullName || email},\n\nYour order #${orderNumber} is reserved. Payment method: ${paymentLabel}.\n\nAmount due: ${formatMoney(totals.total, shop.currency)}\n\nWe'll confirm your order as soon as payment is received.\n\n— ${shop.name}`,
      kind: "payment_instructions"
    }).catch(() => undefined);
    return { orderNumber };
  }

  if (provider === "stripe") {
    const base = getBaseUrl();
    const cancelToken = paymentCancelToken(order.id);
    const session = await createStripeCheckoutSession({
      secretKey: settings.stripeSecretKey,
      orderId: order.id,
      orderNumber,
      shopName: shop.name,
      currency: shop.currency,
      totalCents: totals.total,
      customerEmail: email,
      successUrl: `${base}/api/payments/stripe/return?session_id={CHECKOUT_SESSION_ID}&shop=${encodeURIComponent(shop.slug)}`,
      cancelUrl: `${base}/api/payments/stripe/cancel?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(cancelToken)}`
    });
    if (!session.ok) {
      await cancelPendingOrder(order.id, "Stripe Checkout could not be started.");
      return { error: `Could not start card payment: ${session.error}` };
    }
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: session.id }
    });
    return { orderNumber, redirectUrl: session.url };
  }

  const returnUrl = absoluteUrl(
    `/api/payments/custom/return?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(paymentCancelToken(order.id))}`
  );
  const cancelUrl = absoluteUrl(
    `/api/payments/custom/cancel?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(paymentCancelToken(order.id))}`
  );
  const paymentUrl = buildCustomPaymentUrl({
    baseUrl: settings.customPaymentUrl,
    secret: settings.customPaymentSecret,
    orderId: order.id,
    orderNumber,
    amount: totals.total,
    currency: shop.currency,
    email,
    returnUrl,
    cancelUrl
  });
  if (!paymentUrl) {
    await cancelPendingOrder(order.id, "The external payment provider is not configured correctly.");
    return { error: "The external payment provider is not configured correctly." };
  }
  return { orderNumber, redirectUrl: paymentUrl };
}
