import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import type { Shop, User, Membership } from "@prisma/client";
import { prisma } from "./db";

const COOKIE_NAME = "os_session";
const SESSION_DAYS = 30;

function secretKey(): Uint8Array {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "openstore-dev-secret-change-me"
  );
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

export const getSessionUser = cache(async (): Promise<User | null> => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.uid;
    if (typeof userId !== "string") return null;
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export type ShopContext = {
  user: User;
  membership: Membership;
  shop: Shop;
};

export async function requireShop(
  slug: string,
  opts: { owner?: boolean } = {}
): Promise<ShopContext> {
  const user = await requireUser();
  const shop = await prisma.shop.findUnique({ where: { slug } });
  if (!shop) notFound();

  const membership = await prisma.membership.findUnique({
    where: { userId_shopId: { userId: user.id, shopId: shop.id } }
  });

  if (!membership) {
    const fallback = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { shop: true },
      orderBy: { createdAt: "asc" }
    });
    if (fallback) redirect(`/admin/${fallback.shop.slug}`);
    redirect("/signup");
  }

  if (opts.owner && membership.role !== "OWNER") {
    redirect(
      `/admin/${shop.slug}?error=${encodeURIComponent("Only the store owner can access this page.")}`
    );
  }

  return { user, shop, membership };
}

export function isOwner(membership: Membership): boolean {
  return membership.role === "OWNER";
}
