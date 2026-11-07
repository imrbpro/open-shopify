import { requireShop } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { shop: string };
}) {
  await requireShop(params.shop, { owner: true });
  return children;
}
