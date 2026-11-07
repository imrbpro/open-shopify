import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStore } from "@/lib/storefront";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BlogIndexPage({ params }: { params: { shop: string } }) {
  const store = await getStore(params.shop);
  const posts = await prisma.blogPost.findMany({
    where: { shopId: store.shop.id },
    orderBy: { publishedAt: "desc" }
  });

  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] store-muted">Journal</p>
        <h1 className="store-heading mt-2 text-3xl font-semibold">Stories & notes</h1>
        <p className="mt-2 text-sm store-muted">
          Behind the scenes, care guides and conversations from the workshop.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-16 text-center text-sm store-muted store-border">
          No stories published yet.
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id}>
              <Link href={`/s/${store.shop.slug}/blog/${post.handle}`} className="group block">
                <div className="aspect-[16/9] overflow-hidden rounded-xl border store-border" style={{ background: "var(--os-surface)" }}>
                  {post.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide store-muted">
                  {formatDate(post.publishedAt)}
                  {post.author ? ` · ${post.author}` : ""}
                </p>
                <h2 className="store-heading mt-1 text-xl font-semibold">{post.title}</h2>
                <p className="mt-2 text-sm store-muted">{post.excerpt}</p>
                <span className="mt-3 inline-block text-sm font-medium underline">Read story</span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
