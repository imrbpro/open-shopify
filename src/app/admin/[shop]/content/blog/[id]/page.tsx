import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updatePost, deletePost } from "@/server/actions/content";
import { PostForm } from "@/components/admin/content-forms";
import { Banner, PageHeader } from "@/components/ui";
import { ContentTabs } from "@/components/admin/content-tabs";
import { DeleteButton } from "@/components/delete-button";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
  searchParams
}: {
  params: { shop: string; id: string };
  searchParams?: { created?: string; saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const post = await prisma.blogPost.findFirst({ where: { id: params.id, shopId: shop.id } });
  if (!post) notFound();

  return (
    <div>
      <PageHeader title={post.title} subtitle={`/blog/${post.handle}`} />
      <ContentTabs slug={shop.slug} active="blog" />
      {searchParams?.created ? (
        <div className="mb-4">
          <Banner kind="success">Post created.</Banner>
        </div>
      ) : null}
      {searchParams?.saved ? (
        <div className="mb-4">
          <Banner kind="success">Post saved.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      <PostForm
        action={updatePost}
        shopSlug={shop.slug}
        submitLabel="Save post"
        post={{
          id: post.id,
          title: post.title,
          handle: post.handle,
          excerpt: post.excerpt,
          body: post.body,
          author: post.author,
          image: post.image,
          publishedAt: post.publishedAt
        }}
      />
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
        <form action={deletePost} className="mt-2">
          <input type="hidden" name="shopSlug" value={shop.slug} />
          <input type="hidden" name="id" value={post.id} />
          <DeleteButton message={`Delete post “${post.title}”?`}>Delete post</DeleteButton>
        </form>
      </div>
    </div>
  );
}
