"use server";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import { slugify } from "@/lib/utils";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function uniquePageHandle(shopId: string, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "page";
  let candidate = root;
  let counter = 1;
  while (true) {
    const existing = await prisma.page.findUnique({
      where: { shopId_handle: { shopId, handle: candidate } }
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${counter++}`;
    if (counter > 500) throw new Error("Could not allocate a page handle.");
  }
}

async function uniquePostHandle(shopId: string, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "post";
  let candidate = root;
  let counter = 1;
  while (true) {
    const existing = await prisma.blogPost.findUnique({
      where: { shopId_handle: { shopId, handle: candidate } }
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${counter++}`;
    if (counter > 500) throw new Error("Could not allocate a post handle.");
  }
}

export async function createPage(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const base = `/admin/${shop.slug}/content/pages`;
  const title = text(formData, "title");
  if (!title) redirect(`${base}/new?error=${encodeURIComponent("Page title is required.")}`);

  const page = await prisma.page.create({
    data: {
      shopId: shop.id,
      title,
      handle: await uniquePageHandle(shop.id, text(formData, "handle") || title),
      body: text(formData, "body"),
      published: formData.get("published") === "on"
    }
  });
  redirect(`${base}/${page.id}?created=1`);
}

export async function updatePage(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const pageId = text(formData, "id");
  const existing = await prisma.page.findFirst({ where: { id: pageId, shopId: shop.id } });
  if (!existing) notFound();
  const base = `/admin/${shop.slug}/content/pages/${pageId}`;

  const title = text(formData, "title");
  if (!title) redirect(`${base}?error=${encodeURIComponent("Page title is required.")}`);

  await prisma.page.update({
    where: { id: existing.id },
    data: {
      title,
      handle: await uniquePageHandle(shop.id, text(formData, "handle") || existing.handle, existing.id),
      body: text(formData, "body"),
      published: formData.get("published") === "on"
    }
  });
  redirect(`${base}?saved=1`);
}

export async function deletePage(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const page = await prisma.page.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!page) notFound();
  await prisma.page.delete({ where: { id: page.id } });
  redirect(`/admin/${shop.slug}/content/pages?deleted=1`);
}

export async function createPost(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const base = `/admin/${shop.slug}/content/blog`;
  const title = text(formData, "title");
  if (!title) redirect(`${base}/new?error=${encodeURIComponent("Post title is required.")}`);

  const publishedRaw = text(formData, "publishedAt");
  const publishedAt = publishedRaw ? new Date(`${publishedRaw}T12:00:00`) : new Date();
  if (Number.isNaN(publishedAt.getTime())) {
    redirect(`${base}/new?error=${encodeURIComponent("Published date is invalid.")}`);
  }

  const post = await prisma.blogPost.create({
    data: {
      shopId: shop.id,
      title,
      handle: await uniquePostHandle(shop.id, text(formData, "handle") || title),
      excerpt: text(formData, "excerpt"),
      body: text(formData, "body"),
      author: text(formData, "author") || "Store team",
      image: text(formData, "image") || null,
      publishedAt
    }
  });
  redirect(`${base}/${post.id}?created=1`);
}

export async function updatePost(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const postId = text(formData, "id");
  const existing = await prisma.blogPost.findFirst({ where: { id: postId, shopId: shop.id } });
  if (!existing) notFound();
  const base = `/admin/${shop.slug}/content/blog/${postId}`;

  const title = text(formData, "title");
  if (!title) redirect(`${base}?error=${encodeURIComponent("Post title is required.")}`);

  const publishedRaw = text(formData, "publishedAt");
  const publishedAt = publishedRaw ? new Date(`${publishedRaw}T12:00:00`) : existing.publishedAt;
  if (Number.isNaN(publishedAt.getTime())) {
    redirect(`${base}?error=${encodeURIComponent("Published date is invalid.")}`);
  }

  await prisma.blogPost.update({
    where: { id: existing.id },
    data: {
      title,
      handle: await uniquePostHandle(shop.id, text(formData, "handle") || existing.handle, existing.id),
      excerpt: text(formData, "excerpt"),
      body: text(formData, "body"),
      author: text(formData, "author") || existing.author,
      image: text(formData, "image") || null,
      publishedAt
    }
  });
  redirect(`${base}?saved=1`);
}

export async function deletePost(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const post = await prisma.blogPost.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!post) notFound();
  await prisma.blogPost.delete({ where: { id: post.id } });
  redirect(`/admin/${shop.slug}/content/blog?deleted=1`);
}
