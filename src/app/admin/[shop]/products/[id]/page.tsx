import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProduct, deleteProduct } from "@/server/actions/products";
import { ProductForm } from "@/components/admin/product-form";
import { Banner, PageHeader } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams
}: {
  params: { shop: string; id: string };
  searchParams?: { created?: string; saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const product = await prisma.product.findFirst({
    where: { id: params.id, shopId: shop.id },
    include: { variants: { orderBy: { position: "asc" } } }
  });
  if (!product) notFound();

  return (
    <div>
      <PageHeader
        title={product.title}
        subtitle={`/products/${product.handle}`}
        actions={
          <>
            <Link
              href={`/s/${shop.slug}/products/${product.handle}`}
              target="_blank"
              className="btn btn-outline"
            >
              <Icon name="external" className="h-4 w-4" />
              View
            </Link>
            <Link href={`/admin/${shop.slug}/products`} className="btn btn-ghost">
              All products
            </Link>
          </>
        }
      />
      {searchParams?.created ? (
        <div className="mb-4">
          <Banner kind="success">Product created.</Banner>
        </div>
      ) : null}
      {searchParams?.saved ? (
        <div className="mb-4">
          <Banner kind="success">Product saved.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}

      <ProductForm
        action={updateProduct}
        shopSlug={shop.slug}
        submitLabel="Save changes"
        product={{
          id: product.id,
          title: product.title,
          handle: product.handle,
          description: product.description,
          vendor: product.vendor,
          productType: product.productType,
          tags: product.tags,
          status: product.status,
          image: product.image ?? undefined,
          variants: product.variants.map((variant) => ({
            title: variant.title,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            cost: variant.cost,
            sku: variant.sku,
            inventoryQty: variant.inventoryQty
          }))
        }}
      />

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
        <p className="mt-1 text-xs text-red-700">
          Deleting a product removes its variants and collection links. Existing order line items
          keep their historical data.
        </p>
        <form action={deleteProduct} className="mt-3">
          <input type="hidden" name="shopSlug" value={shop.slug} />
          <input type="hidden" name="id" value={product.id} />
          <DeleteButton message={`Delete “${product.title}”? This cannot be undone.`}>
            Delete product
          </DeleteButton>
        </form>
      </div>
    </div>
  );
}
