import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Banner, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";
import { toggleDiscount, deleteDiscount } from "@/server/actions/discounts";

export const dynamic = "force-dynamic";

function discountValueLabel(type: string, value: number, currency: string): string {
  if (type === "PERCENTAGE") return `${value}% off`;
  if (type === "FIXED") return `${formatMoney(value, currency)} off`;
  return "Free shipping";
}

export default async function DiscountsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { deleted?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const discounts = await prisma.discount.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <PageHeader
        title="Discounts"
        subtitle="Percentage, fixed amount and free shipping codes."
        actions={
          <Link href={`/admin/${shop.slug}/discounts/new`} className="btn btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Create discount
          </Link>
        }
      />
      {searchParams?.deleted ? (
        <div className="mb-4">
          <Banner kind="success">Discount deleted.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}

      {discounts.length === 0 ? (
        <EmptyState
          title="Create your first discount"
          description="Reward loyal customers, run a launch promo, or offer free shipping over a threshold."
          action={
            <Link href={`/admin/${shop.slug}/discounts/new`} className="btn btn-primary">
              Create discount
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="th">Code</th>
                  <th className="th">Value</th>
                  <th className="th">Minimum</th>
                  <th className="th">Used</th>
                  <th className="th">Dates</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-slate-50/70">
                    <td className="td">
                      <Link
                        href={`/admin/${shop.slug}/discounts/${discount.id}`}
                        className="font-mono text-sm font-semibold text-slate-900 hover:text-emerald-700"
                      >
                        {discount.code}
                      </Link>
                      {discount.oncePerCustomer ? (
                        <p className="text-[11px] text-slate-400">Once per customer</p>
                      ) : null}
                    </td>
                    <td className="td">{discountValueLabel(discount.type, discount.value, shop.currency)}</td>
                    <td className="td text-slate-500">
                      {discount.minSubtotal > 0 ? formatMoney(discount.minSubtotal, shop.currency) : "—"}
                    </td>
                    <td className="td text-slate-500">
                      {discount.usedCount}
                      {discount.usageLimit ? ` / ${discount.usageLimit}` : ""}
                    </td>
                    <td className="td text-xs text-slate-500">
                      {discount.startsAt ? formatDate(discount.startsAt) : "Now"}
                      {" → "}
                      {discount.endsAt ? formatDate(discount.endsAt) : "No end"}
                    </td>
                    <td className="td">
                      <StatusBadge status={discount.status} />
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1.5">
                        <form action={toggleDiscount}>
                          <input type="hidden" name="shopSlug" value={shop.slug} />
                          <input type="hidden" name="id" value={discount.id} />
                          <button className="btn btn-ghost btn-sm" type="submit">
                            {discount.status === "ACTIVE" ? "Disable" : "Enable"}
                          </button>
                        </form>
                        <Link
                          href={`/admin/${shop.slug}/discounts/${discount.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                        <form action={deleteDiscount}>
                          <input type="hidden" name="shopSlug" value={shop.slug} />
                          <input type="hidden" name="id" value={discount.id} />
                          <DeleteButton message={`Delete ${discount.code}?`}>
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </DeleteButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Codes are validated at checkout against usage limits, expiry and minimum subtotal. Free
        shipping discounts waive the selected shipping rate.
      </p>
    </div>
  );
}
