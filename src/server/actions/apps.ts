"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { dispatchWebhooks } from "@/lib/webhooks";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function installApp(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const appId = text(formData, "appId");
  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) redirect(`/admin/${shop.slug}/apps?error=${encodeURIComponent("App not found.")}`);

  await prisma.appInstallation.upsert({
    where: { shopId_appId: { shopId: shop.id, appId: app.id } },
    create: { shopId: shop.id, appId: app.id, status: "ACTIVE" },
    update: { status: "ACTIVE" }
  });

  redirect(`/admin/${shop.slug}/apps?installed=${encodeURIComponent(app.name)}`);
}

export async function uninstallApp(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const appId = text(formData, "appId");
  const installation = await prisma.appInstallation.findUnique({
    where: { shopId_appId: { shopId: shop.id, appId } },
    include: { app: true }
  });
  if (!installation) redirect(`/admin/${shop.slug}/apps`);

  await prisma.appInstallation.delete({ where: { id: installation.id } });
  await dispatchWebhooks(shop.slug, shop.id, "app/uninstalled", {
    app: installation.app.handle
  });

  redirect(`/admin/${shop.slug}/apps?uninstalled=${encodeURIComponent(installation.app.name)}`);
}
