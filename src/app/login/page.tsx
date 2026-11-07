import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { shop: true },
      orderBy: { createdAt: "asc" }
    });
    redirect(membership ? `/admin/${membership.shop.slug}` : "/admin");
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your store.">
      <AuthForm mode="login" />
    </AuthShell>
  );
}
