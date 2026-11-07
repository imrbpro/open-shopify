import { requireShop } from "@/lib/auth";
import { createCustomer } from "@/server/actions/customers";
import { CustomerForm } from "@/components/admin/customer-form";
import { Banner, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { error?: string };
}) {
  const { shop } = await requireShop(params.shop);

  return (
    <div>
      <PageHeader title="Add customer" subtitle="Create a customer profile manually." />
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}
      <CustomerForm action={createCustomer} shopSlug={shop.slug} submitLabel="Save customer" />
    </div>
  );
}
