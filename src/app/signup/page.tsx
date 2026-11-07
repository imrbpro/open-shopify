import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create your store" };

export default async function SignupPage() {
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
    <AuthShell
      title="Create your store"
      subtitle="Launch a complete storefront and admin in seconds. No credit card required."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
