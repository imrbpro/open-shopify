import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { installApp, uninstallApp } from "@/server/actions/apps";
import { Banner, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AppsPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { installed?: string; uninstalled?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const [apps, installations] = await Promise.all([
    prisma.app.findMany({ orderBy: { name: "asc" } }),
    prisma.appInstallation.findMany({ where: { shopId: shop.id } })
  ]);
  const installed = new Map(installations.map((installation) => [installation.appId, installation]));

  return (
    <div>
      <PageHeader
        title="Apps"
        subtitle={`${installations.length} installed · built-in storefront features, free forever`}
      />
      {searchParams?.installed ? (
        <div className="mb-4">
          <Banner kind="success">{searchParams.installed} installed. Installed apps can change storefront behavior immediately.</Banner>
        </div>
      ) : null}
      {searchParams?.uninstalled ? (
        <div className="mb-4">
          <Banner kind="info">{searchParams.uninstalled} uninstalled.</Banner>
        </div>
      ) : null}
      {searchParams?.error ? (
        <div className="mb-4">
          <Banner>{searchParams.error}</Banner>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => {
          const installation = installed.get(app.id);
          const capabilities = app.capabilities
            .split(",")
            .map((capability) => capability.trim())
            .filter(Boolean);
          return (
            <div key={app.id} className="card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                  style={{ background: app.color }}
                >
                  {app.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{app.name}</h3>
                    {installation ? <StatusBadge status="ACTIVE" /> : null}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {app.developer} · {app.category}
                  </p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-slate-600">{app.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {capabilities.map((capability) => (
                  <span key={capability} className="badge bg-slate-100 text-slate-600">
                    {capability}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-emerald-700">{app.priceLabel}</p>
                {installation ? (
                  <form action={uninstallApp}>
                    <input type="hidden" name="shopSlug" value={shop.slug} />
                    <input type="hidden" name="appId" value={app.id} />
                    <button className="btn btn-ghost btn-sm" type="submit">
                      Uninstall
                    </button>
                  </form>
                ) : (
                  <form action={installApp}>
                    <input type="hidden" name="shopSlug" value={shop.slug} />
                    <input type="hidden" name="appId" value={app.id} />
                    <button className="btn btn-primary btn-sm" type="submit">
                      Install
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Built-in apps, no marketplace required</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          These features ship with OpenStore and are checked at render time. Turn on{" "}
          <strong>Product Reviews</strong> for review lists and forms, <strong>Email Marketing</strong>{" "}
          for newsletter capture, <strong>Wishlist</strong> for saved items and{" "}
          <strong>Recently Viewed</strong> for a browsing-history rail. Uninstalling removes the
          storefront feature immediately.
        </p>
      </div>
    </div>
  );
}
