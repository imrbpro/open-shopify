import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inviteStaff, removeStaff } from "@/server/actions/settings";
import { Banner, PageHeader, SettingsTabs, StatusBadge } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop, { owner: true });
  const memberships = await prisma.membership.findMany({
    where: { shopId: shop.id },
    include: { user: true },
    orderBy: { createdAt: "asc" }
  });
  return (
    <div>
      <PageHeader title="Users & permissions" subtitle="People who can access this store's admin." />
      <SettingsTabs slug={shop.slug} active="users" />

      <div className="space-y-4">
        {searchParams?.saved ? <Banner kind="success">Team updated.</Banner> : null}
        {searchParams?.error ? <Banner kind="error">{searchParams.error}</Banner> : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <div>
              <h2 className="section-title">Team members</h2>
              <p className="text-xs text-slate-500">{memberships.length} team members</p>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Member</th>
                <th className="th">Role</th>
                <th className="th text-right">Added</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberships.map((membership) => (
                <tr key={membership.id}>
                  <td className="td">
                    <p className="font-medium text-slate-900">{membership.user.name}</p>
                    <p className="text-xs text-slate-500">{membership.user.email}</p>
                  </td>
                  <td className="td">
                    <StatusBadge status={membership.role} />
                  </td>
                  <td className="td text-right text-xs text-slate-500">
                    {formatDate(membership.createdAt)}
                  </td>
                  <td className="td text-right">
                    {membership.role === "OWNER" ? (
                      <span className="text-xs text-slate-400">Owner</span>
                    ) : (
                      <form action={removeStaff} className="inline">
                        <input type="hidden" name="shopSlug" value={shop.slug} />
                        <input type="hidden" name="id" value={membership.id} />
                        <DeleteButton message={`Remove ${membership.user.name} from this store?`}>
                          Remove
                        </DeleteButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card-pad">
          <h2 className="section-title">Invite staff</h2>
          <p className="mb-4 text-xs text-slate-500">
            Staff can manage products, orders, customers and content. Only owners can access settings.
          </p>
          <form action={inviteStaff} className="space-y-3">
            <input type="hidden" name="shopSlug" value={shop.slug} />
            <div>
              <label className="label" htmlFor="staff-name">
                Name
              </label>
              <input id="staff-name" name="name" className="input" placeholder="Alex Rivera" required />
            </div>
            <div>
              <label className="label" htmlFor="staff-email">
                Email
              </label>
              <input
                id="staff-email"
                name="email"
                type="email"
                className="input"
                placeholder="alex@store.com"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="staff-password">
                Temporary password
              </label>
              <input
                id="staff-password"
                name="password"
                type="text"
                minLength={8}
                className="input"
                placeholder="At least 8 characters"
                required
              />
              <p className="hint">Share it securely. Staff can log in at /login.</p>
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Add staff member
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
