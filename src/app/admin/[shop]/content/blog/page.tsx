import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Banner, EmptyState, PageHeader } from "@/components/ui";
import { ContentTabs } from "@/components/admin/content-tabs";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function BlogAdminPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { deleted?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const posts = await prisma.blogPost.findMany({
    where: { shopId: shop.id },
    orderBy: { publishedAt: "desc" }
  });

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="Pages and blog posts for your storefront."
        actions={
          <Link href={`/admin/${shop.slug}/content/blog/new`} className="btn btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Add blog post
          </Link>
        }
      />
      <ContentTabs slug={shop.slug} active="blog" />
      {searchParams?.deleted ? (
        <div className="mb-4">
          <Banner kind="success">Blog post deleted.</Banner>
        </div>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState
          title="Add your first blog post"
          description="Tell the story behind your products. Posts appear on the storefront journal."
          action={
            <Link href={`/admin/${shop.slug}/content/blog/new`} className="btn btn-primary">
              Add blog post
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Post</th>
                <th className="th">Author</th>
                <th className="th">Published</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/70">
                  <td className="td">
                    <p className="font-medium text-slate-900">{post.title}</p>
                    <p className="text-[11px] text-slate-400">/blog/{post.handle}</p>
                  </td>
                  <td className="td text-slate-500">{post.author}</td>
                  <td className="td text-slate-500">{formatDate(post.publishedAt)}</td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/s/${shop.slug}/blog/${post.handle}`}
                        target="_blank"
                        className="btn btn-ghost btn-sm"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/${shop.slug}/content/blog/${post.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
