import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Banner, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { deleted?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const collections = await prisma.collection.findMany({
    where: { shopId: shop.id },
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div>
      <PageHeader
        title="Collections"
        subtitle="Group products into manual or automated collections."
        actions={
          <Link href={`/admin/${shop.slug}/collections/new`} className="btn btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Create collection
          </Link>
        }
      />
      {searchParams?.deleted ? (
        <div className="mb-4">
          <Banner kind="success">Collection deleted.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}

      {collections.length === 0 ? (
        <EmptyState
          title="Create your first collection"
          description="Collections power storefront navigation. Use manual picks or automate by product type, vendor, tag or price."
          action={
            <Link href={`/admin/${shop.slug}/collections/new`} className="btn btn-primary">
              Create collection
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <div key={collection.id} className="card overflow-hidden">
              <div className="flex h-28 items-center justify-center bg-slate-100">
                {collection.image ? (
                  <img src={collection.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Icon name="collections" className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{collection.title}</h3>
                    <p className="text-[11px] text-slate-400">/collections/{collection.handle}</p>
                  </div>
                  <StatusBadge status={collection.type} />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                  {collection.description || "No description"}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">
                    {collection.type === "AUTOMATED" ? "Rules-based" : `${collection._count.products} products`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/s/${shop.slug}/collections/${collection.handle}`}
                      target="_blank"
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/${shop.slug}/collections/${collection.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
