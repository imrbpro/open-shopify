import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { shop: true },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) redirect("/signup");
  redirect(`/admin/${membership.shop.slug}`);
}
