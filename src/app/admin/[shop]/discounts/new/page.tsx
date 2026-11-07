import { requireShop } from "@/lib/auth";
import { createDiscount } from "@/server/actions/discounts";
import { DiscountForm } from "@/components/admin/discount-form";
import { Banner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewDiscountPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { error?: string };
}) {
  const { shop } = await requireShop(params.shop);

  return (
    <div>
      <PageHeader title="Create discount" subtitle="Set up a code customers can redeem at checkout." />
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      <DiscountForm action={createDiscount} shopSlug={shop.slug} submitLabel="Create discount" />
    </div>
  );
}
