import { requireShop } from "@/lib/auth";
import { createPost } from "@/server/actions/content";
import { PostForm } from "@/components/admin/content-forms";
import { Banner, PageHeader } from "@/components/ui";
import { ContentTabs } from "@/components/admin/content-tabs";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  return (
    <div>
      <PageHeader title="Add blog post" subtitle="Write for the storefront journal." />
      <ContentTabs slug={shop.slug} active="blog" />
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      <PostForm action={createPost} shopSlug={shop.slug} submitLabel="Save post" />
    </div>
  );
}
