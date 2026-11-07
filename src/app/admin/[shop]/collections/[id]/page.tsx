import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateCollection, deleteCollection } from "@/server/actions/collections";
import { CollectionForm } from "@/components/admin/collection-form";
import { Banner, PageHeader } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({
  params,
  searchParams
}: {
  params: { shop: string; id: string };
  searchParams?: { created?: string; saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const collection = await prisma.collection.findFirst({
    where: { id: params.id, shopId: shop.id },
    include: { products: true }
  });
  if (!collection) notFound();

  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    select: { id: true, title: true, image: true, status: true },
    orderBy: { title: "asc" }
  });

  return (
    <div>
      <PageHeader
        title={collection.title}
        subtitle={`/collections/${collection.handle}`}
        actions={
          <Link
            href={`/s/${shop.slug}/collections/${collection.handle}`}
            target="_blank"
            className="btn btn-outline"
          >
            <Icon name="external" className="h-4 w-4" />
            View
          </Link>
        }
      />
      {searchParams?.created ? (
        <div className="mb-4">
          <Banner kind="success">Collection created.</Banner>
        </div>
      ) : null}
      {searchParams?.saved ? (
        <div className="mb-4">
          <Banner kind="success">Collection saved.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}

      <CollectionForm
        action={updateCollection}
        shopSlug={shop.slug}
        products={products}
        submitLabel="Save changes"
        collection={{
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
          description: collection.description,
          image: collection.image,
          type: collection.type,
          rulesJson: collection.rulesJson,
          productIds: collection.products.map((link) => link.productId)
        }}
      />

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
        <p className="mt-1 text-xs text-red-700">
          Deleting a collection does not delete its products.
        </p>
        <form action={deleteCollection} className="mt-3">
          <input type="hidden" name="shopSlug" value={shop.slug} />
          <input type="hidden" name="id" value={collection.id} />
          <DeleteButton message={`Delete “${collection.title}”?`}>Delete collection</DeleteButton>
        </form>
      </div>
    </div>
  );
}
