import Link from "next/link";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseThemeConfig } from "@/lib/theme";
import { activateTheme } from "@/server/actions/themes";
import { Banner, PageHeader, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ThemesPage({
  params,
  searchParams
}: {
  params: { shop: string };
  searchParams?: { activated?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const themes = await prisma.theme.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "asc" }
  });
  const main = themes.find((theme) => theme.role === "MAIN");

  return (
    <div>
      <PageHeader
        title="Online store"
        subtitle="Themes change the look and feel of your storefront."
        actions={
          <>
            <Link href={`/s/${shop.slug}`} target="_blank" className="btn btn-outline">
              <Icon name="external" className="h-4 w-4" />
              View store
            </Link>
            {main ? (
              <Link
                href={`/admin/${shop.slug}/online-store/themes/${main.id}`}
                className="btn btn-primary"
              >
                Customize theme
              </Link>
            ) : null}
          </>
        }
      />
      {searchParams?.activated ? (
        <div className="mb-4">
          <Banner kind="success">Theme published to your storefront.</Banner>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => {
          const config = parseThemeConfig(theme.configJson);
          return (
            <div key={theme.id} className="card overflow-hidden">
              <div
                className="relative h-40 overflow-hidden border-b"
                style={{
                  background: `linear-gradient(135deg, ${config.colors.background}, ${config.colors.surface})`,
                  borderColor: config.colors.border
                }}
              >
                <div className="absolute inset-4 rounded-lg border p-4" style={{ borderColor: config.colors.border, background: config.colors.background }}>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: config.colors.text, fontFamily: config.fonts.heading === "serif" ? "Georgia, serif" : "Inter, sans-serif" }}
                  >
                    {config.hero.heading}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[10px]" style={{ color: config.colors.muted }}>
                    {config.hero.subheading}
                  </p>
                  <span
                    className="mt-3 inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold text-white"
                    style={{ background: config.colors.primary }}
                  >
                    {config.hero.ctaLabel}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{theme.name}</h3>
                    <p className="text-[11px] text-slate-400">Preset: {theme.preset}</p>
                  </div>
                  <StatusBadge status={theme.role} />
                </div>
                <div className="mt-3 flex gap-1">
                  {[
                    config.colors.primary,
                    config.colors.background,
                    config.colors.surface,
                    config.colors.text,
                    config.colors.accent
                  ].map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      className="h-5 w-5 rounded-full border border-black/10"
                      style={{ background: color }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/admin/${shop.slug}/online-store/themes/${theme.id}`}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    Customize
                  </Link>
                  {theme.role === "MAIN" ? (
                    <Link href={`/s/${shop.slug}`} target="_blank" className="btn btn-ghost btn-sm">
                      Preview
                    </Link>
                  ) : (
                    <form action={activateTheme} className="flex-1">
                      <input type="hidden" name="shopSlug" value={shop.slug} />
                      <input type="hidden" name="id" value={theme.id} />
                      <button className="btn btn-dark btn-sm w-full" type="submit">
                        Publish
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h2 className="text-sm font-semibold text-slate-900">How themes work here</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          A theme is a JSON design-token document: colors, fonts, hero copy and announcement bar.
          The active (MAIN) theme is resolved at request time for the storefront. Publishing a
          different theme instantly changes the storefront. Customize the MAIN theme to edit it.
        </p>
      </div>
    </div>
  );
}
