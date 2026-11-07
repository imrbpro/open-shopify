import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlanSeed } from "@/lib/plans";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Start your free trial" };

export default async function SignupPage({
  searchParams
}: {
  searchParams?: { plan?: string };
}) {
  const user = await getSessionUser();
  if (user) {
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
      include: { shop: true },
      orderBy: { createdAt: "asc" }
    });
    redirect(membership ? `/admin/${membership.shop.slug}` : "/admin");
  }

  const plan = searchParams?.plan && getPlanSeed(searchParams.plan) ? searchParams.plan : "shopify";

  return (
    <AuthShell
      title="Start your free trial"
      subtitle="Create your store in seconds. No credit card required."
    >
      <AuthForm mode="signup" plan={plan} />
    </AuthShell>
  );
}
