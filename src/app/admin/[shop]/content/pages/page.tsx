import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Banner, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { ContentTabs } from "@/components/admin/content-tabs";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PagesAdminPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { deleted?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const pages = await prisma.page.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="Pages and blog posts for your storefront."
        actions={
          <Link href={`/admin/${shop.slug}/content/pages/new`} className="btn btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Add page
          </Link>
        }
      />
      <ContentTabs slug={shop.slug} active="pages" />
      {searchParams?.deleted ? (
        <div className="mb-4">
          <Banner kind="success">Page deleted.</Banner>
        </div>
      ) : null}

      {pages.length === 0 ? (
        <EmptyState
          title="Add your first page"
          description="About, FAQ, shipping policy — pages appear in the storefront footer and can be linked from navigation."
          action={
            <Link href={`/admin/${shop.slug}/content/pages/new`} className="btn btn-primary">
              Add page
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="th">Title</th>
                <th className="th">Handle</th>
                <th className="th">Visibility</th>
                <th className="th">Created</th>
                <th className="th text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50/70">
                  <td className="td font-medium text-slate-900">{page.title}</td>
                  <td className="td text-slate-500">/pages/{page.handle}</td>
                  <td className="td">
                    <StatusBadge status={page.published ? "ACTIVE" : "DRAFT"} />
                  </td>
                  <td className="td text-slate-500">{formatDate(page.createdAt)}</td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-2">
                      {page.published ? (
                        <Link
                          href={`/s/${shop.slug}/pages/${page.handle}`}
                          target="_blank"
                          className="btn btn-ghost btn-sm"
                        >
                          View
                        </Link>
                      ) : null}
                      <Link
                        href={`/admin/${shop.slug}/content/pages/${page.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
