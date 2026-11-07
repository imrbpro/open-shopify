"use server";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { isWithinPlanLimit } from "@/lib/plans";
import { parseMoneyToCents } from "@/lib/money";
import { slugify, tagsToCsv } from "@/lib/utils";
import { dispatchWebhooks } from "@/lib/webhooks";

type ParsedVariant = {
  title: string;
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  sku: string | null;
  inventoryQty: number;
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseVariants(raw: FormDataEntryValue | null): ParsedVariant[] {
  let rows: unknown;
  try {
    rows = JSON.parse(typeof raw === "string" && raw ? raw : "[]");
  } catch {
    throw new Error("Variant data is invalid.");
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Add at least one variant.");
  }
  if (rows.length > 100) throw new Error("A product can have at most 100 variants.");

  return rows.map((row, index) => {
    if (!row || typeof row !== "object") throw new Error("Variant data is invalid.");
    const record = row as Record<string, unknown>;
    const title =
      typeof record.title === "string" && record.title.trim()
        ? record.title.trim()
        : index === 0
          ? "Default Title"
          : `Variant ${index + 1}`;
    const price = parseMoneyToCents(typeof record.price === "string" ? record.price : "");
    if (price === null || price < 0) throw new Error(`Variant “${title}” needs a valid price.`);
    const compareAt = parseMoneyToCents(
      typeof record.compareAt === "string" ? record.compareAt : ""
    );
    const cost = parseMoneyToCents(typeof record.cost === "string" ? record.cost : "");
    const inventoryRaw = Number(record.inventory);
    const inventoryQty =
      Number.isFinite(inventoryRaw) && inventoryRaw >= 0 ? Math.floor(inventoryRaw) : 0;
    const sku =
      typeof record.sku === "string" && record.sku.trim() ? record.sku.trim() : null;
    return {
      title,
      price,
      compareAtPrice: compareAt !== null && compareAt > 0 ? compareAt : null,
      cost: cost !== null && cost > 0 ? cost : null,
      sku,
      inventoryQty
    };
  });
}

async function uniqueHandle(shopId: string, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "product";
  let candidate = root;
  let counter = 1;
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { shopId_handle: { shopId, handle: candidate } }
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${counter++}`;
    if (counter > 500) throw new Error("Could not allocate a product handle.");
  }
}

async function assertProductLimit(shopId: string, plan: { productLimit: number | null } | undefined) {
  if (!plan) return;
  const count = await prisma.product.count({ where: { shopId } });
  if (!isWithinPlanLimit(plan, "products", count)) {
    throw new Error(
      "Your plan's product limit has been reached. Upgrade your plan in Plan & billing to add more."
    );
  }
}

export async function createProduct(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const base = `/admin/${shop.slug}/products`;

  let variants: ParsedVariant[];
  let title: string;
  try {
    title = text(formData, "title");
    if (!title) throw new Error("Product title is required.");
    await assertProductLimit(shop.id, shop.subscription?.plan);
    variants = parseVariants(formData.get("variants"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the product.";
    redirect(`${base}/new?error=${encodeURIComponent(message)}`);
  }

  const handleInput = text(formData, "handle");
  const handle = await uniqueHandle(shop.id, handleInput || title);
  const image = text(formData, "image") || "/images/placeholder.svg";

  const product = await prisma.product.create({
    data: {
      shopId: shop.id,
      title,
      handle,
      description: text(formData, "description"),
      vendor: text(formData, "vendor"),
      productType: text(formData, "productType"),
      tags: tagsToCsv(text(formData, "tags").split(",")),
      status: ["ACTIVE", "DRAFT", "ARCHIVED"].includes(text(formData, "status"))
        ? text(formData, "status")
        : "DRAFT",
      image,
      images: { create: [{ url: image, alt: title, position: 0 }] },
      variants: {
        create: variants.map((variant, index) => ({
          title: variant.title,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          cost: variant.cost,
          sku: variant.sku,
          inventoryQty: variant.inventoryQty,
          trackInventory: true,
          position: index
        }))
      }
    }
  });

  await dispatchWebhooks(shop.slug, shop.id, "products/create", {
    id: product.id,
    title: product.title,
    handle: product.handle,
    status: product.status
  });

  redirect(`${base}/${product.id}?created=1`);
}

export async function updateProduct(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const productId = text(formData, "id");
  const base = `/admin/${shop.slug}/products/${productId}`;

  const existing = await prisma.product.findFirst({ where: { id: productId, shopId: shop.id } });
  if (!existing) notFound();

  let variants: ParsedVariant[];
  let title: string;
  try {
    title = text(formData, "title");
    if (!title) throw new Error("Product title is required.");
    variants = parseVariants(formData.get("variants"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the product.";
    redirect(`${base}?error=${encodeURIComponent(message)}`);
  }

  const handleInput = text(formData, "handle");
  const handle = await uniqueHandle(shop.id, handleInput || existing.handle || title, existing.id);
  const image = text(formData, "image") || "/images/placeholder.svg";
  const status = ["ACTIVE", "DRAFT", "ARCHIVED"].includes(text(formData, "status"))
    ? text(formData, "status")
    : existing.status;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: existing.id },
      data: {
        title,
        handle,
        description: text(formData, "description"),
        vendor: text(formData, "vendor"),
        productType: text(formData, "productType"),
        tags: tagsToCsv(text(formData, "tags").split(",")),
        status,
        image
      }
    });
    await tx.productVariant.deleteMany({ where: { productId: existing.id } });
    await tx.productVariant.createMany({
      data: variants.map((variant, index) => ({
        productId: existing.id,
        title: variant.title,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        cost: variant.cost,
        sku: variant.sku,
        inventoryQty: variant.inventoryQty,
        trackInventory: true,
        position: index
      }))
    });
    await tx.productImage.deleteMany({ where: { productId: existing.id } });
    await tx.productImage.create({
      data: { productId: existing.id, url: image, alt: title, position: 0 }
    });
  });

  await dispatchWebhooks(shop.slug, shop.id, "products/update", {
    id: existing.id,
    title,
    handle,
    status
  });

  redirect(`${base}?saved=1`);
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const productId = text(formData, "id");
  const product = await prisma.product.findFirst({ where: { id: productId, shopId: shop.id } });
  if (!product) notFound();

  await prisma.product.delete({ where: { id: product.id } });
  await dispatchWebhooks(shop.slug, shop.id, "products/delete", {
    id: product.id,
    title: product.title,
    handle: product.handle
  });
  redirect(`/admin/${shop.slug}/products?deleted=1`);
}
