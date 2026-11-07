import { requireShop } from "@/lib/auth";
import { createPage } from "@/server/actions/content";
import { PageForm } from "@/components/admin/content-forms";
import { Banner, PageHeader } from "@/components/ui";
import { ContentTabs } from "@/components/admin/content-tabs";

export const dynamic = "force-dynamic";

export default async function NewPagePage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  return (
    <div>
      <PageHeader title="Add page" subtitle="Publish a static content page." />
      <ContentTabs slug={shop.slug} active="pages" />
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      <PageForm action={createPage} shopSlug={shop.slug} submitLabel="Save page" />
    </div>
  );
}
