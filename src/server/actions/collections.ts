"use server";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { parseMoneyToCents } from "@/lib/money";
import { slugify } from "@/lib/utils";
import { dispatchWebhooks } from "@/lib/webhooks";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function uniqueHandle(shopId: string, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "collection";
  let candidate = root;
  let counter = 1;
  while (true) {
    const existing = await prisma.collection.findUnique({
      where: { shopId_handle: { shopId, handle: candidate } }
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${counter++}`;
    if (counter > 500) throw new Error("Could not allocate a collection handle.");
  }
}

function buildRules(formData: FormData, type: string): string | null {
  if (type !== "AUTOMATED") return null;
  const rules: Record<string, unknown> = {};
  const productType = text(formData, "ruleProductType");
  const vendor = text(formData, "ruleVendor");
  const tag = text(formData, "ruleTag");
  const priceMin = parseMoneyToCents(text(formData, "rulePriceMin"));
  const priceMax = parseMoneyToCents(text(formData, "rulePriceMax"));
  if (productType) rules.productType = productType;
  if (vendor) rules.vendor = vendor;
  if (tag) rules.tag = tag;
  if (priceMin !== null) rules.priceMin = priceMin;
  if (priceMax !== null) rules.priceMax = priceMax;
  return JSON.stringify(rules);
}

function selectedProductIds(formData: FormData): string[] {
  return formData
    .getAll("productIds")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
}

export async function createCollection(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const base = `/admin/${shop.slug}/collections`;

  const title = text(formData, "title");
  if (!title) redirect(`${base}/new?error=${encodeURIComponent("Collection title is required.")}`);

  const type = text(formData, "type") === "AUTOMATED" ? "AUTOMATED" : "MANUAL";
  const handle = await uniqueHandle(shop.id, text(formData, "handle") || title);

  const collection = await prisma.collection.create({
    data: {
      shopId: shop.id,
      title,
      handle,
      description: text(formData, "description"),
      image: text(formData, "image") || null,
      type,
      rulesJson: buildRules(formData, type)
    }
  });

  if (type === "MANUAL") {
    const ids = selectedProductIds(formData);
    const products = await prisma.product.findMany({
      where: { shopId: shop.id, id: { in: ids } },
      select: { id: true }
    });
    if (products.length > 0) {
      await prisma.collectionProduct.createMany({
        data: products.map((product, index) => ({
          collectionId: collection.id,
          productId: product.id,
          position: index
        }))
      });
    }
  }

  await dispatchWebhooks(shop.slug, shop.id, "products/update", {
    collection: { id: collection.id, title: collection.title, handle: collection.handle }
  });

  redirect(`${base}/${collection.id}?created=1`);
}

export async function updateCollection(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const collectionId = text(formData, "id");
  const base = `/admin/${shop.slug}/collections/${collectionId}`;

  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, shopId: shop.id }
  });
  if (!existing) notFound();

  const title = text(formData, "title");
  if (!title) redirect(`${base}?error=${encodeURIComponent("Collection title is required.")}`);

  const type = text(formData, "type") === "AUTOMATED" ? "AUTOMATED" : "MANUAL";
  const handle = await uniqueHandle(shop.id, text(formData, "handle") || existing.handle || title, existing.id);

  await prisma.$transaction(async (tx) => {
    await tx.collection.update({
      where: { id: existing.id },
      data: {
        title,
        handle,
        description: text(formData, "description"),
        image: text(formData, "image") || null,
        type,
        rulesJson: buildRules(formData, type)
      }
    });
    await tx.collectionProduct.deleteMany({ where: { collectionId: existing.id } });
    if (type === "MANUAL") {
      const ids = selectedProductIds(formData);
      const products = await tx.product.findMany({
        where: { shopId: shop.id, id: { in: ids } },
        select: { id: true }
      });
      if (products.length > 0) {
        await tx.collectionProduct.createMany({
          data: products.map((product, index) => ({
            collectionId: existing.id,
            productId: product.id,
            position: index
          }))
        });
      }
    }
  });

  redirect(`${base}?saved=1`);
}

export async function deleteCollection(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const collectionId = text(formData, "id");
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, shopId: shop.id }
  });
  if (!collection) notFound();
  await prisma.collection.delete({ where: { id: collection.id } });
  redirect(`/admin/${shop.slug}/collections?deleted=1`);
}
