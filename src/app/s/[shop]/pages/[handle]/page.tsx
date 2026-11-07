import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStore } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params
}: {
  params: { shop: string; handle: string };
}) {
  const store = await getStore(params.shop);
  const page = await prisma.page.findUnique({
    where: { shopId_handle: { shopId: store.shop.id, handle: params.handle } }
  });
  if (!page || !page.published) notFound();

  const paragraphs = page.body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] store-muted">Page</p>
      <h1 className="store-heading mt-2 text-3xl font-semibold">{page.title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed store-muted">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
        ) : (
          <p>This page is empty.</p>
        )}
      </div>
    </article>
  );
}
