import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCollection } from "@/server/actions/collections";
import { CollectionForm } from "@/components/admin/collection-form";
import { Banner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewCollectionPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    select: { id: true, title: true, image: true, status: true },
    orderBy: { title: "asc" }
  });

  return (
    <div>
      <PageHeader title="Create collection" subtitle="Manual or rules-based product grouping." />
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      <CollectionForm
        action={createCollection}
        shopSlug={shop.slug}
        products={products}
        submitLabel="Save collection"
      />
    </div>
  );
}
