"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { getShopSettings, setShopSettings } from "@/lib/settings";
import { parseMoneyToCents } from "@/lib/money";
import { queueEmail } from "@/lib/email";
import {
  ANALYTICS_PROVIDERS,
  EMAIL_PROVIDERS,
  PAYMENT_PROVIDERS
} from "@/lib/settings-defaults";
import { generateWebhookSecret, signPayload, WEBHOOK_TOPICS } from "@/lib/webhooks";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function updateGeneralSettings(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/general`;

  const name = text(formData, "name");
  const email = text(formData, "email");
  if (!name) redirect(`${base}?error=${encodeURIComponent("Store name is required.")}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`${base}?error=${encodeURIComponent("Enter a valid store email.")}`);
  }

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      name,
      email,
      description: text(formData, "description"),
      currency: text(formData, "currency") || shop.currency,
      country: text(formData, "country") || shop.country,
      timezone: text(formData, "timezone") || shop.timezone
    }
  });

  redirect(`${base}?saved=1`);
}

export async function updateCheckoutSettings(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/checkout`;

  const taxRate = Number(text(formData, "taxRatePct") || "0");
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    redirect(`${base}?error=${encodeURIComponent("Tax rate must be between 0 and 100.")}`);
  }
  const lowStock = Number(text(formData, "lowStockThreshold") || "5");
  if (!Number.isFinite(lowStock) || lowStock < 0) {
    redirect(`${base}?error=${encodeURIComponent("Low stock threshold must be zero or greater.")}`);
  }

  await setShopSettings(shop.id, {
    taxRatePct: taxRate,
    taxShipping: bool(formData, "taxShipping"),
    checkoutNote: text(formData, "checkoutNote"),
    lowStockThreshold: Math.floor(lowStock),
    newsletterEnabled: bool(formData, "newsletterEnabled")
  });

  redirect(`${base}?saved=1`);
}

function validHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateIntegrationSettings(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/integrations`;

  const paymentProvider = text(formData, "paymentProvider");
  const emailProvider = text(formData, "emailProvider");
  const analyticsProvider = text(formData, "analyticsProvider");
  if (!PAYMENT_PROVIDERS.includes(paymentProvider as (typeof PAYMENT_PROVIDERS)[number])) {
    redirect(`${base}?error=${encodeURIComponent("Choose a valid payment provider.")}`);
  }
  if (!EMAIL_PROVIDERS.includes(emailProvider as (typeof EMAIL_PROVIDERS)[number])) {
    redirect(`${base}?error=${encodeURIComponent("Choose a valid email provider.")}`);
  }
  if (!ANALYTICS_PROVIDERS.includes(analyticsProvider as (typeof ANALYTICS_PROVIDERS)[number])) {
    redirect(`${base}?error=${encodeURIComponent("Choose a valid analytics provider.")}`);
  }

  const customPaymentUrl = text(formData, "customPaymentUrl");
  const emailWebhookUrl = text(formData, "emailWebhookUrl");
  const customAnalyticsScriptUrl = text(formData, "customAnalyticsScriptUrl");
  if (!validHttpUrl(customPaymentUrl)) {
    redirect(`${base}?error=${encodeURIComponent("The custom payment URL must start with http:// or https://.")}`);
  }
  if (!validHttpUrl(emailWebhookUrl)) {
    redirect(`${base}?error=${encodeURIComponent("The email webhook URL must start with http:// or https://.")}`);
  }
  if (!validHttpUrl(customAnalyticsScriptUrl)) {
    redirect(`${base}?error=${encodeURIComponent("The analytics script URL must start with http:// or https://.")}`);
  }

  await setShopSettings(shop.id, {
    paymentProvider,
    stripePublishableKey: text(formData, "stripePublishableKey"),
    stripeSecretKey: text(formData, "stripeSecretKey"),
    stripeWebhookSecret: text(formData, "stripeWebhookSecret"),
    customPaymentName: text(formData, "customPaymentName"),
    customPaymentUrl,
    customPaymentSecret: text(formData, "customPaymentSecret"),
    emailProvider,
    emailFrom: text(formData, "emailFrom"),
    emailReplyTo: text(formData, "emailReplyTo"),
    resendApiKey: text(formData, "resendApiKey"),
    emailWebhookUrl,
    emailWebhookSecret: text(formData, "emailWebhookSecret"),
    analyticsProvider,
    gaMeasurementId: text(formData, "gaMeasurementId"),
    gtmContainerId: text(formData, "gtmContainerId"),
    plausibleDomain: text(formData, "plausibleDomain"),
    customAnalyticsScriptUrl
  });

  redirect(`${base}?saved=1`);
}

export async function sendTestEmail(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/integrations`;
  const settings = await getShopSettings(shop.id);
  const to = text(formData, "to") || shop.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    redirect(`${base}?error=${encodeURIComponent("Enter a valid test recipient email.")}`);
  }

  const message = await queueEmail({
    shopId: shop.id,
    to,
    subject: `OpenStore test email — ${shop.name}`,
    body: `This is a test email from ${shop.name}.\n\nProvider: ${settings.emailProvider}\nSent at: ${new Date().toISOString()}\n\nIf you can read this, your email integration is working.`,
    kind: "test"
  });

  redirect(`${base}?test=${encodeURIComponent(message.status)}#email`);
}

export async function createShippingRate(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/checkout`;
  const name = text(formData, "name");
  const price = parseMoneyToCents(text(formData, "price"));
  const freeOver = parseMoneyToCents(text(formData, "minSubtotal")) ?? 0;

  if (!name) redirect(`${base}?error=${encodeURIComponent("Shipping rate name is required.")}`);
  if (price === null || price < 0) {
    redirect(`${base}?error=${encodeURIComponent("Shipping price must be zero or greater.")}`);
  }

  await prisma.shippingRate.create({
    data: { shopId: shop.id, name, price, minSubtotal: freeOver, active: true }
  });
  redirect(`${base}?saved=1`);
}

export async function updateShippingRate(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/checkout`;
  const rate = await prisma.shippingRate.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!rate) notFound();

  const price = parseMoneyToCents(text(formData, "price"));
  const freeOver = parseMoneyToCents(text(formData, "minSubtotal")) ?? 0;
  if (price === null || price < 0) {
    redirect(`${base}?error=${encodeURIComponent("Shipping price must be zero or greater.")}`);
  }

  await prisma.shippingRate.update({
    where: { id: rate.id },
    data: {
      name: text(formData, "name") || rate.name,
      price,
      minSubtotal: freeOver,
      active: bool(formData, "active")
    }
  });
  redirect(`${base}?saved=1`);
}

export async function deleteShippingRate(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const rate = await prisma.shippingRate.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!rate) notFound();
  await prisma.shippingRate.delete({ where: { id: rate.id } });
  redirect(`/admin/${shop.slug}/settings/checkout?saved=1`);
}

export async function updateNotificationSettings(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/notifications`;

  await setShopSettings(shop.id, {
    orderConfirmationSubject: text(formData, "orderConfirmationSubject"),
    orderConfirmationBody: text(formData, "orderConfirmationBody"),
    shippingEmailSubject: text(formData, "shippingEmailSubject"),
    shippingEmailBody: text(formData, "shippingEmailBody")
  });

  redirect(`${base}?saved=1`);
}

export async function inviteStaff(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop, user } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/users`;

  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  if (!name) redirect(`${base}?error=${encodeURIComponent("Staff name is required.")}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`${base}?error=${encodeURIComponent("Enter a valid staff email.")}`);
  }
  if (password.length < 8) {
    redirect(`${base}?error=${encodeURIComponent("Temp password must be at least 8 characters.")}`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const membership = await prisma.membership.findUnique({
      where: { userId_shopId: { userId: existingUser.id, shopId: shop.id } }
    });
    if (membership) {
      redirect(`${base}?error=${encodeURIComponent("That user is already a member of this store.")}`);
    }
    await prisma.membership.create({
      data: { userId: existingUser.id, shopId: shop.id, role: "STAFF" }
    });
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: { name, email, passwordHash }
    });
    await prisma.membership.create({
      data: { userId: created.id, shopId: shop.id, role: "STAFF" }
    });
  }

  void user;
  redirect(`${base}?saved=1`);
}

export async function removeStaff(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const membership = await prisma.membership.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id },
    include: { user: true }
  });
  if (!membership) notFound();
  if (membership.role === "OWNER") {
    redirect(
      `/admin/${shop.slug}/settings/users?error=${encodeURIComponent("The store owner cannot be removed.")}`
    );
  }
  await prisma.membership.delete({ where: { id: membership.id } });
  redirect(`/admin/${shop.slug}/settings/users?saved=1`);
}

export async function createApiKey(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const label = text(formData, "label") || "Untitled key";
  await prisma.apiKey.create({
    data: {
      shopId: shop.id,
      label,
      token: `os_${randomBytes(18).toString("hex")}`,
      scopes: "read_products,write_products,read_orders"
    }
  });
  redirect(`/admin/${shop.slug}/settings/api?saved=1`);
}

export async function revokeApiKey(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const key = await prisma.apiKey.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!key) notFound();
  await prisma.apiKey.delete({ where: { id: key.id } });
  redirect(`/admin/${shop.slug}/settings/api?saved=1`);
}

export async function createWebhook(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/settings/webhooks`;
  const topic = text(formData, "topic");
  const url = text(formData, "url");

  if (!WEBHOOK_TOPICS.includes(topic as (typeof WEBHOOK_TOPICS)[number])) {
    redirect(`${base}?error=${encodeURIComponent("Choose a valid webhook topic.")}`);
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad protocol");
  } catch {
    redirect(`${base}?error=${encodeURIComponent("Enter a valid http(s) webhook URL.")}`);
  }

  await prisma.webhook.create({
    data: {
      shopId: shop.id,
      topic,
      url,
      secret: text(formData, "secret") || generateWebhookSecret(),
      active: true
    }
  });
  redirect(`${base}?saved=1`);
}

export async function toggleWebhook(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const webhook = await prisma.webhook.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!webhook) notFound();
  await prisma.webhook.update({
    where: { id: webhook.id },
    data: { active: !webhook.active }
  });
  redirect(`/admin/${shop.slug}/settings/webhooks?saved=1`);
}

export async function deleteWebhook(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const webhook = await prisma.webhook.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!webhook) notFound();
  await prisma.webhook.delete({ where: { id: webhook.id } });
  redirect(`/admin/${shop.slug}/settings/webhooks?saved=1`);
}

export async function testWebhook(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const webhook = await prisma.webhook.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!webhook) notFound();

  const payload = JSON.stringify({
    topic: webhook.topic,
    shop: shop.slug,
    triggered_at: new Date().toISOString(),
    data: { test: true }
  });
  let responseCode: number | null = null;
  let error: string | null = null;
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-openstore-topic": webhook.topic,
        "x-openstore-hmac-sha256": signPayload(payload, webhook.secret)
      },
      body: payload,
      signal: AbortSignal.timeout(5000)
    });
    responseCode = response.status;
  } catch (err) {
    error = err instanceof Error ? err.message : "Request failed";
  }
  await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      topic: webhook.topic,
      url: webhook.url,
      responseCode,
      error
    }
  });
  redirect(`/admin/${shop.slug}/settings/webhooks?saved=1`);
}
