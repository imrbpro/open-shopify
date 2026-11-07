"use server";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { tagsToCsv } from "@/lib/utils";
import { dispatchWebhooks } from "@/lib/webhooks";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createCustomer(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const base = `/admin/${shop.slug}/customers`;

  const email = text(formData, "email").toLowerCase();
  const firstName = text(formData, "firstName");
  if (!isEmail(email)) redirect(`${base}/new?error=${encodeURIComponent("Enter a valid email address.")}`);
  if (!firstName) redirect(`${base}/new?error=${encodeURIComponent("First name is required.")}`);

  const existing = await prisma.customer.findUnique({
    where: { shopId_email: { shopId: shop.id, email } }
  });
  if (existing) {
    redirect(`${base}/new?error=${encodeURIComponent("A customer with that email already exists.")}`);
  }

  const customer = await prisma.customer.create({
    data: {
      shopId: shop.id,
      email,
      firstName,
      lastName: text(formData, "lastName"),
      phone: text(formData, "phone") || null,
      tags: tagsToCsv(text(formData, "tags").split(",")),
      note: text(formData, "note") || null,
      marketingOptIn: formData.get("marketingOptIn") === "on"
    }
  });

  await dispatchWebhooks(shop.slug, shop.id, "customers/create", {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName
  });

  redirect(`${base}/${customer.id}`);
}

export async function updateCustomer(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const customerId = text(formData, "id");
  const base = `/admin/${shop.slug}/customers/${customerId}`;

  const existing = await prisma.customer.findFirst({
    where: { id: customerId, shopId: shop.id }
  });
  if (!existing) notFound();

  const email = text(formData, "email").toLowerCase();
  if (!isEmail(email)) redirect(`${base}?error=${encodeURIComponent("Enter a valid email address.")}`);
  const firstName = text(formData, "firstName");
  if (!firstName) redirect(`${base}?error=${encodeURIComponent("First name is required.")}`);

  const duplicate = await prisma.customer.findFirst({
    where: { shopId: shop.id, email, NOT: { id: existing.id } }
  });
  if (duplicate) {
    redirect(`${base}?error=${encodeURIComponent("Another customer already uses that email.")}`);
  }

  await prisma.customer.update({
    where: { id: existing.id },
    data: {
      email,
      firstName,
      lastName: text(formData, "lastName"),
      phone: text(formData, "phone") || null,
      tags: tagsToCsv(text(formData, "tags").split(",")),
      note: text(formData, "note") || null,
      marketingOptIn: formData.get("marketingOptIn") === "on"
    }
  });

  redirect(`${base}?saved=1`);
}

export async function deleteCustomer(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const customerId = text(formData, "id");
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId: shop.id }
  });
  if (!customer) notFound();
  await prisma.customer.delete({ where: { id: customer.id } });
  redirect(`/admin/${shop.slug}/customers?deleted=1`);
}
