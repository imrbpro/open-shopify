"use server";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { parseMoneyToCents } from "@/lib/money";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/\s+/g, "");
}

function parseDate(value: string, endOfDay = false): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDiscountInputs(formData: FormData):
  | { error: string }
  | {
      code: string;
      type: string;
      value: number;
      minSubtotal: number;
      usageLimit: number | null;
      oncePerCustomer: boolean;
      startsAt: Date | null;
      endsAt: Date | null;
    } {
  const code = normalizeCode(text(formData, "code"));
  if (!code) return { error: "Discount code is required." };
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { error: "Use letters, numbers, dashes or underscores for the code." };
  }

  const type = text(formData, "type");
  if (!["PERCENTAGE", "FIXED", "FREE_SHIPPING"].includes(type)) {
    return { error: "Choose a valid discount type." };
  }

  let value = 0;
  if (type === "PERCENTAGE") {
    const percent = Number(text(formData, "value"));
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      return { error: "Percentage discounts must be between 0 and 100." };
    }
    value = Math.round(percent);
  } else if (type === "FIXED") {
    const cents = parseMoneyToCents(text(formData, "value"));
    if (cents === null || cents <= 0) return { error: "Enter a fixed discount amount." };
    value = cents;
  }

  const minSubtotal = parseMoneyToCents(text(formData, "minSubtotal")) ?? 0;
  if (minSubtotal < 0) return { error: "Minimum subtotal cannot be negative." };

  const usageLimitRaw = text(formData, "usageLimit");
  let usageLimit: number | null = null;
  if (usageLimitRaw) {
    const limit = Number(usageLimitRaw);
    if (!Number.isFinite(limit) || limit <= 0) return { error: "Usage limit must be a positive number." };
    usageLimit = Math.floor(limit);
  }

  const startsAt = parseDate(text(formData, "startsAt"));
  const endsAt = parseDate(text(formData, "endsAt"), true);
  if (startsAt && endsAt && endsAt < startsAt) {
    return { error: "End date cannot be before the start date." };
  }

  return {
    code,
    type,
    value,
    minSubtotal,
    usageLimit,
    oncePerCustomer: formData.get("oncePerCustomer") === "on",
    startsAt,
    endsAt
  };
}

export async function createDiscount(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const base = `/admin/${shop.slug}/discounts`;

  const parsed = parseDiscountInputs(formData);
  if ("error" in parsed) redirect(`${base}/new?error=${encodeURIComponent(parsed.error)}`);

  const existing = await prisma.discount.findUnique({
    where: { shopId_code: { shopId: shop.id, code: parsed.code } }
  });
  if (existing) {
    redirect(`${base}/new?error=${encodeURIComponent("A discount with that code already exists.")}`);
  }

  const discount = await prisma.discount.create({
    data: {
      shopId: shop.id,
      code: parsed.code,
      type: parsed.type,
      value: parsed.value,
      minSubtotal: parsed.minSubtotal,
      usageLimit: parsed.usageLimit,
      oncePerCustomer: parsed.oncePerCustomer,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt
    }
  });

  redirect(`${base}/${discount.id}?created=1`);
}

export async function updateDiscount(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const discountId = text(formData, "id");
  const base = `/admin/${shop.slug}/discounts/${discountId}`;

  const existing = await prisma.discount.findFirst({
    where: { id: discountId, shopId: shop.id }
  });
  if (!existing) notFound();

  const parsed = parseDiscountInputs(formData);
  if ("error" in parsed) redirect(`${base}?error=${encodeURIComponent(parsed.error)}`);

  const duplicate = await prisma.discount.findFirst({
    where: { shopId: shop.id, code: parsed.code, NOT: { id: existing.id } }
  });
  if (duplicate) {
    redirect(`${base}?error=${encodeURIComponent("Another discount already uses that code.")}`);
  }

  await prisma.discount.update({
    where: { id: existing.id },
    data: {
      code: parsed.code,
      type: parsed.type,
      value: parsed.value,
      minSubtotal: parsed.minSubtotal,
      usageLimit: parsed.usageLimit,
      oncePerCustomer: parsed.oncePerCustomer,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt
    }
  });

  redirect(`${base}?saved=1`);
}

export async function toggleDiscount(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const discountId = text(formData, "id");
  const discount = await prisma.discount.findFirst({
    where: { id: discountId, shopId: shop.id }
  });
  if (!discount) notFound();
  await prisma.discount.update({
    where: { id: discount.id },
    data: { status: discount.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }
  });
  redirect(`/admin/${shop.slug}/discounts`);
}

export async function deleteDiscount(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const discountId = text(formData, "id");
  const discount = await prisma.discount.findFirst({
    where: { id: discountId, shopId: shop.id }
  });
  if (!discount) notFound();
  await prisma.discount.delete({ where: { id: discount.id } });
  redirect(`/admin/${shop.slug}/discounts?deleted=1`);
}
