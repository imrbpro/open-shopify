import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateDiscount, deleteDiscount } from "@/server/actions/discounts";
import { DiscountForm } from "@/components/admin/discount-form";
import { Banner, PageHeader } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";

export const dynamic = "force-dynamic";

export default async function EditDiscountPage({
  params,
  searchParams
}: {
  params: { shop: string; id: string };
  searchParams?: { created?: string; saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const discount = await prisma.discount.findFirst({
    where: { id: params.id, shopId: shop.id }
  });
  if (!discount) notFound();

  return (
    <div>
      <PageHeader
        title={discount.code}
        subtitle={`${discount.usedCount} redemption${discount.usedCount === 1 ? "" : "s"}`}
      />
      {searchParams?.created ? (
        <div className="mb-4">
          <Banner kind="success">Discount created.</Banner>
        </div>
      ) : null}
      {searchParams?.saved ? (
        <div className="mb-4">
          <Banner kind="success">Discount saved.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}

      <DiscountForm
        action={updateDiscount}
        shopSlug={shop.slug}
        submitLabel="Save discount"
        discount={{
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          minSubtotal: discount.minSubtotal,
          usageLimit: discount.usageLimit,
          oncePerCustomer: discount.oncePerCustomer,
          startsAt: discount.startsAt,
          endsAt: discount.endsAt
        }}
      />

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
        <form action={deleteDiscount} className="mt-2">
          <input type="hidden" name="shopSlug" value={shop.slug} />
          <input type="hidden" name="id" value={discount.id} />
          <DeleteButton message={`Delete discount ${discount.code}?`}>Delete discount</DeleteButton>
        </form>
      </div>
    </div>
  );
}
