import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStore } from "@/lib/storefront";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({
  params
}: {
  params: { shop: string; handle: string };
}) {
  const store = await getStore(params.shop);
  const post = await prisma.blogPost.findUnique({
    where: { shopId_handle: { shopId: store.shop.id, handle: params.handle } }
  });
  if (!post) notFound();

  const paragraphs = post.body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-2xl">
      <Link href={`/s/${store.shop.slug}/blog`} className="text-xs font-medium underline store-muted">
        ← All stories
      </Link>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide store-muted">
        {formatDate(post.publishedAt)}
        {post.author ? ` · ${post.author}` : ""}
      </p>
      <h1 className="store-heading mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{post.title}</h1>
      {post.excerpt ? <p className="mt-3 text-base leading-relaxed store-muted">{post.excerpt}</p> : null}
      {post.image ? (
        <div className="mt-6 aspect-[16/9] overflow-hidden rounded-xl border store-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="mt-6 space-y-4 text-sm leading-relaxed store-muted">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
