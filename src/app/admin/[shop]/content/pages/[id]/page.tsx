import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updatePage, deletePage } from "@/server/actions/content";
import { PageForm } from "@/components/admin/content-forms";
import { Banner, PageHeader } from "@/components/ui";
import { ContentTabs } from "@/components/admin/content-tabs";
import { DeleteButton } from "@/components/delete-button";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
  searchParams
}: {
  params: { shop: string; id: string };
  searchParams?: { created?: string; saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const page = await prisma.page.findFirst({ where: { id: params.id, shopId: shop.id } });
  if (!page) notFound();

  return (
    <div>
      <PageHeader title={page.title} subtitle={`/pages/${page.handle}`} />
      <ContentTabs slug={shop.slug} active="pages" />
      {searchParams?.created ? (
        <div className="mb-4">
          <Banner kind="success">Page created.</Banner>
        </div>
      ) : null}
      {searchParams?.saved ? (
        <div className="mb-4">
          <Banner kind="success">Page saved.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      <PageForm
        action={updatePage}
        shopSlug={shop.slug}
        submitLabel="Save page"
        page={{
          id: page.id,
          title: page.title,
          handle: page.handle,
          body: page.body,
          published: page.published
        }}
      />
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
        <form action={deletePage} className="mt-2">
          <input type="hidden" name="shopSlug" value={shop.slug} />
          <input type="hidden" name="id" value={page.id} />
          <DeleteButton message={`Delete page “${page.title}”?`}>Delete page</DeleteButton>
        </form>
      </div>
    </div>
  );
}
