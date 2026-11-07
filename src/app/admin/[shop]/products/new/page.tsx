import { requireShop } from "@/lib/auth";
import { createProduct } from "@/server/actions/products";
import { ProductForm } from "@/components/admin/product-form";
import { Banner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewProductPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { error?: string };
}) {
  const { shop } = await requireShop(params.shop);

  return (
    <div>
      <PageHeader title="Add product" subtitle="Create a product, its options and inventory." />
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      <ProductForm action={createProduct} shopSlug={shop.slug} submitLabel="Save product" />
    </div>
  );
}
