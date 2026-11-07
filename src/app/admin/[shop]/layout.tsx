import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { logoutAction } from "@/server/actions/auth";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { AdminNav, MobileAdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { shop: string };
}) {
  const { shop, user, membership } = await requireShop(params.shop);
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 lg:flex">
        <div className="px-5 py-4">
          <Link href={`/admin/${shop.slug}`} className="block">
            <Logo light />
          </Link>
        </div>
        <div className="mx-3 mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
              {shop.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{shop.name}</p>
              <p className="truncate text-[11px] text-slate-400">{shop.slug}</p>
            </div>
          </div>
        </div>
        <AdminNav slug={shop.slug} role={membership.role} />
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user.name}</p>
              <p className="truncate text-[10px] uppercase tracking-wide text-slate-500">
                {membership.role.toLowerCase()}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Log out"
                className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <Icon name="logout" className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white lg:hidden">
                {shop.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{shop.name}</p>
                <p className="hidden text-[11px] text-slate-500 sm:block">Store admin</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/s/${shop.slug}`} target="_blank" className="btn btn-outline btn-sm">
                <Icon name="external" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View store</span>
              </Link>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 sm:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                  {initials}
                </span>
                <span className="max-w-[120px] truncate text-xs font-medium text-slate-700">{user.name}</span>
              </div>
            </div>
          </div>
        </header>
        <MobileAdminNav slug={shop.slug} role={membership.role} />
        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 lg:px-8">
          {children}
        </main>
        <div className="px-4 pb-6 text-center text-[11px] text-slate-400 lg:px-8">
          OpenStore · free, open-source commerce
        </div>
      </div>
    </div>
  );
}
