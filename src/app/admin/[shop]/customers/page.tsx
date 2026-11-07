import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Banner, EmptyState, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { q?: string; deleted?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const q = searchParams?.q?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: {
      shopId: shop.id,
      ...(q
        ? {
            OR: [
              { email: { contains: q } },
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { tags: { contains: q.toLowerCase() } }
            ]
          }
        : {})
    },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customer${customers.length === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}`}
        actions={
          <Link href={`/admin/${shop.slug}/customers/new`} className="btn btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Add customer
          </Link>
        }
      />
      {searchParams?.deleted ? (
        <div className="mb-4">
          <Banner kind="success">Customer deleted.</Banner>
        </div>
      ) : null}

      <form method="get" className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email or tag"
            className="input w-72 pl-8"
          />
        </div>
        <button className="btn btn-outline" type="submit">
          Search
        </button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title={q ? "No customers match that search" : "No customers yet"}
          description={
            q
              ? "Try a different name, email or tag."
              : "Customers are created automatically at checkout, or you can add them manually."
          }
          action={
            <Link href={`/admin/${shop.slug}/customers/new`} className="btn btn-primary">
              Add customer
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="th">Customer</th>
                  <th className="th">Email</th>
                  <th className="th">Orders</th>
                  <th className="th text-right">Total spent</th>
                  <th className="th">Tags</th>
                  <th className="th">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/70">
                    <td className="td">
                      <Link
                        href={`/admin/${shop.slug}/customers/${customer.id}`}
                        className="font-medium text-slate-900 hover:text-emerald-700"
                      >
                        {`${customer.firstName} ${customer.lastName}`.trim() || "Unnamed customer"}
                      </Link>
                      {customer.phone ? (
                        <p className="text-[11px] text-slate-400">{customer.phone}</p>
                      ) : null}
                    </td>
                    <td className="td text-slate-500">{customer.email}</td>
                    <td className="td">{customer._count.orders}</td>
                    <td className="td text-right font-medium">
                      {formatMoney(customer.totalSpent, shop.currency)}
                    </td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags
                          ? customer.tags.split(",").map((tag) => (
                              <span key={tag} className="badge bg-slate-100 text-slate-600">
                                {tag}
                              </span>
                            ))
                          : <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="td text-slate-500">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
