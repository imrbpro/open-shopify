"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { addDays } from "@/lib/utils";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function nextInvoiceNumber(): Promise<string> {
  const last = await prisma.invoice.findFirst({ orderBy: { createdAt: "desc" } });
  const parsed = last ? Number(last.number.replace(/\D/g, "")) : 1000;
  return `INV-${(Number.isFinite(parsed) ? parsed : 1000) + 1}`;
}

export async function changePlan(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const planCode = text(formData, "planCode");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/billing`;

  const plan = await prisma.plan.findFirst({ where: { OR: [{ id: planCode }, { code: planCode }] } });
  if (!plan) redirect(`${base}?error=${encodeURIComponent("That plan does not exist.")}`);

  const subscription = shop.subscription;
  if (!subscription) {
    const now = new Date();
    await prisma.subscription.create({
      data: {
        shopId: shop.id,
        planId: plan.id,
        status: "TRIALING",
        currentPeriodStart: now,
        currentPeriodEnd: addDays(now, 30),
        trialEndsAt: addDays(now, plan.trialDays)
      }
    });
    redirect(`${base}?saved=1`);
  }

  if (subscription.planId === plan.id) {
    redirect(`${base}?error=${encodeURIComponent("You are already on this plan.")}`);
  }

  const [productCount, staffCount] = await Promise.all([
    prisma.product.count({ where: { shopId: shop.id } }),
    prisma.membership.count({ where: { shopId: shop.id } })
  ]);

  if (plan.productLimit !== null && productCount > plan.productLimit) {
    redirect(
      `${base}?error=${encodeURIComponent(
        `The ${plan.name} plan supports ${plan.productLimit} products. Archive ${
          productCount - plan.productLimit
        } product(s) before downgrading.`
      )}`
    );
  }
  if (plan.staffLimit !== null && staffCount > plan.staffLimit) {
    redirect(
      `${base}?error=${encodeURIComponent(
        `The ${plan.name} plan includes ${plan.staffLimit} staff seat(s). Remove ${
          staffCount - plan.staffLimit
        } teammate(s) before downgrading.`
      )}`
    );
  }

  const now = new Date();
  const wasTrialing = subscription.status === "TRIALING";
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, 30),
      cancelledAt: null
    }
  });

  if (!wasTrialing) {
    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        number: await nextInvoiceNumber(),
        amount: plan.priceMonthly,
        status: "PAID",
        periodStart: now,
        periodEnd: addDays(now, 30)
      }
    });
  }

  redirect(`${base}?saved=1`);
}

export async function cancelSubscription(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const subscription = shop.subscription;
  if (!subscription) {
    redirect(`/admin/${shop.slug}/billing?error=${encodeURIComponent("No subscription found.")}`);
  }
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "CANCELLED", cancelledAt: new Date() }
  });
  redirect(`/admin/${shop.slug}/billing?saved=1`);
}

export async function resumeSubscription(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug, { owner: true });
  const base = `/admin/${shop.slug}/billing`;
  const subscription = shop.subscription;
  if (!subscription) {
    redirect(`${base}?error=${encodeURIComponent("No subscription found.")}`);
  }
  if (subscription.status !== "CANCELLED") {
    redirect(`${base}?error=${encodeURIComponent("This subscription is already active.")}`);
  }

  const now = new Date();
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, 30),
      cancelledAt: null
    }
  });
  await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      number: await nextInvoiceNumber(),
      amount: subscription.plan.priceMonthly,
      status: "PAID",
      periodStart: now,
      periodEnd: addDays(now, 30)
    }
  });
  redirect(`${base}?saved=1`);
}
