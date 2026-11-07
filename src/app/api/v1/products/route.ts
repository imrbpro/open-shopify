import { z } from "zod";
import { prisma } from "@/lib/db";
import { authenticateApiRequest, hasScope, unauthorized } from "@/lib/api-auth";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

const variantSchema = z.object({
  title: z.string().trim().min(1).optional(),
  sku: z.string().trim().optional().nullable(),
  price: z.number().int().nonnegative(),
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  cost: z.number().int().nonnegative().optional().nullable(),
  inventoryQty: z.number().int().nonnegative().optional(),
  trackInventory: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  taxable: z.boolean().optional()
});

const productSchema = z.object({
  title: z.string().trim().min(1).max(200),
  handle: z.string().trim().optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional(),
  image: z.string().optional().nullable(),
  price: z.number().int().nonnegative().optional(),
  variants: z.array(variantSchema).min(1).optional()
});

function serializeProduct(product: {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string;
  status: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants: {
    id: string;
    title: string;
    sku: string | null;
    price: number;
    compareAtPrice: number | null;
    inventoryQty: number;
    trackInventory: boolean;
  }[];
}) {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    vendor: product.vendor,
    product_type: product.productType,
    tags: product.tags ? product.tags.split(",") : [],
    status: product.status,
    image: product.image,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: variant.price,
      compare_at_price: variant.compareAtPrice,
      inventory_quantity: variant.inventoryQty,
      track_inventory: variant.trackInventory
    }))
  };
}

export async function GET(request: Request): Promise<Response> {
  const context = await authenticateApiRequest(request);
  if (!context) return unauthorized();
  if (!hasScope(context.key, "read_products")) {
    return Response.json({ errors: "Missing read_products scope." }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(250, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const status = url.searchParams.get("status")?.toUpperCase();
  const query = url.searchParams.get("q")?.trim();

  const products = await prisma.product.findMany({
    where: {
      shopId: context.shop.id,
      ...(status && ["ACTIVE", "DRAFT", "ARCHIVED"].includes(status) ? { status } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { handle: { contains: query } },
              { vendor: { contains: query } },
              { tags: { contains: query.toLowerCase() } }
            ]
          }
        : {})
    },
    include: { variants: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
    take: limit
  });

  return Response.json({ products: products.map(serializeProduct) });
}

export async function POST(request: Request): Promise<Response> {
  const context = await authenticateApiRequest(request);
  if (!context) return unauthorized();
  if (!hasScope(context.key, "write_products")) {
    return Response.json({ errors: "Missing write_products scope." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ errors: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`) },
      { status: 422 }
    );
  }
  const input = parsed.data;

  const baseHandle = slugify(input.handle || input.title) || "product";
  let handle = baseHandle;
  let suffix = 2;
  while (
    await prisma.product.findUnique({
      where: { shopId_handle: { shopId: context.shop.id, handle } }
    })
  ) {
    handle = `${baseHandle}-${suffix}`;
    suffix += 1;
  }

  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).join(",")
    : (input.tags ?? "");

  const variants =
    input.variants && input.variants.length > 0
      ? input.variants
      : [{ title: "Default Title", price: input.price ?? 0 }];

  const product = await prisma.product.create({
    data: {
      shopId: context.shop.id,
      title: input.title,
      handle,
      description: input.description ?? "",
      vendor: input.vendor ?? "",
      productType: input.productType ?? "",
      tags,
      status: input.status ?? "DRAFT",
      image: input.image ?? null,
      variants: {
        create: variants.map((variant, index) => ({
          title: variant.title ?? "Default Title",
          sku: variant.sku ?? null,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice ?? null,
          cost: variant.cost ?? null,
          inventoryQty: variant.inventoryQty ?? 0,
          trackInventory: variant.trackInventory ?? true,
          requiresShipping: variant.requiresShipping ?? true,
          taxable: variant.taxable ?? true,
          position: index,
          optionsJson: "{}"
        }))
      }
    },
    include: { variants: { orderBy: { position: "asc" } } }
  });

  return Response.json({ product: serializeProduct(product) }, { status: 201 });
}
