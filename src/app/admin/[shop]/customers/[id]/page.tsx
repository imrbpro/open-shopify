import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { updateCustomer, deleteCustomer } from "@/server/actions/customers";
import { CustomerForm } from "@/components/admin/customer-form";
import { Banner, PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
  searchParams
}: {
  params: { shop: string; id: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const customer = await prisma.customer.findFirst({
    where: { id: params.id, shopId: shop.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      addresses: true
    }
  });
  if (!customer) notFound();

  return (
    <div>
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`.trim() || customer.email}
        subtitle={`Customer since ${formatDate(customer.createdAt)}`}
        actions={
          <>
            <a href={`mailto:${customer.email}`} className="btn btn-outline">
              Email customer
            </a>
            <Link href={`/admin/${shop.slug}/customers`} className="btn btn-ghost">
              All customers
            </Link>
          </>
        }
      />
      {searchParams?.saved ? (
        <div className="mb-4">
          <Banner kind="success">Customer saved.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orders</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{customer.ordersCount}</p>
        </div>
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total spent</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatMoney(customer.totalSpent, shop.currency)}
          </p>
        </div>
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email consent</p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {customer.marketingOptIn ? "Subscribed to marketing" : "Not subscribed"}
          </p>
          <p className="text-[11px] text-slate-400">{customer.email}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3.5">
              <h2 className="section-title">Order history</h2>
            </div>
            {customer.orders.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No orders yet" description="Orders placed with this email will appear here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Order</th>
                      <th className="th">Date</th>
                      <th className="th">Payment</th>
                      <th className="th">Fulfillment</th>
                      <th className="th text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="td">
                          <Link
                            href={`/admin/${shop.slug}/orders/${order.id}`}
                            className="font-medium text-emerald-700 hover:underline"
                          >
                            #{order.number}
                          </Link>
                        </td>
                        <td className="td text-slate-500">{formatDate(order.createdAt)}</td>
                        <td className="td">
                          <StatusBadge status={order.financialStatus} />
                        </td>
                        <td className="td">
                          <StatusBadge status={order.fulfillmentStatus} />
                        </td>
                        <td className="td text-right">{formatMoney(order.total, order.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card card-pad">
            <h2 className="section-title">Addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No saved addresses. Addresses are saved from checkout.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">{address.name}</p>
                      {address.isDefault ? (
                        <span className="badge bg-slate-100 text-slate-500">Default</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-slate-600">{address.line1}</p>
                    {address.line2 ? <p className="text-slate-600">{address.line2}</p> : null}
                    <p className="text-slate-600">
                      {[address.city, address.province, address.zip].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-slate-600">{address.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CustomerForm
            action={updateCustomer}
            shopSlug={shop.slug}
            submitLabel="Save customer"
            customer={{
              id: customer.id,
              email: customer.email,
              firstName: customer.firstName,
              lastName: customer.lastName,
              phone: customer.phone,
              tags: customer.tags,
              note: customer.note,
              marketingOptIn: customer.marketingOptIn
            }}
          />

          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="text-sm font-semibold text-red-800">Danger zone</h2>
            <p className="mt-1 text-xs text-red-700">
              Deleting a customer keeps order history but removes their profile and addresses.
            </p>
            <form action={deleteCustomer} className="mt-3">
              <input type="hidden" name="shopSlug" value={shop.slug} />
              <input type="hidden" name="id" value={customer.id} />
              <DeleteButton message={`Delete customer “${customer.email}”?`}>Delete customer</DeleteButton>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card card-pad">
            <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <Icon name="customers" className="mt-0.5 h-4 w-4 text-slate-400" />
                <span className="text-slate-700">
                  {`${customer.firstName} ${customer.lastName}`.trim() || "—"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="external" className="mt-0.5 h-4 w-4 text-slate-400" />
                <a href={`mailto:${customer.email}`} className="text-emerald-700 hover:underline">
                  {customer.email}
                </a>
              </li>
              {customer.phone ? (
                <li className="flex items-start gap-2">
                  <Icon name="globe" className="mt-0.5 h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{customer.phone}</span>
                </li>
              ) : null}
            </ul>
            {customer.tags ? (
              <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-3">
                {customer.tags.split(",").map((tag) => (
                  <span key={tag} className="badge bg-slate-100 text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {customer.note ? (
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">{customer.note}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
