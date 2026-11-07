import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShop } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseThemeConfig, THEME_PRESETS } from "@/lib/theme";
import { updateThemeSettings } from "@/server/actions/themes";
import { Banner, PageHeader, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CustomizeThemePage({
  params,
  searchParams
}: {
  params: { shop: string; id: string };
  searchParams?: { saved?: string; error?: string };
}) {
  const { shop } = await requireShop(params.shop);
  const theme = await prisma.theme.findFirst({ where: { id: params.id, shopId: shop.id } });
  if (!theme) notFound();
  const config = parseThemeConfig(theme.configJson);

  return (
    <div>
      <PageHeader
        title={`Customize ${theme.name}`}
        subtitle="Design tokens applied to the storefront at request time."
        actions={
          <>
            <StatusBadge status={theme.role} />
            <Link href={`/admin/${shop.slug}/online-store/themes`} className="btn btn-ghost">
              All themes
            </Link>
            <Link href={`/s/${shop.slug}`} target="_blank" className="btn btn-primary">
              <Icon name="external" className="h-4 w-4" />
              Preview
            </Link>
          </>
        }
      />
      {searchParams?.saved ? (
        <div className="mb-4">
          <Banner kind="success">Theme settings saved.</Banner>
        </div>
      ) : null}
      {theme.role !== "MAIN" ? (
        <div className="mb-4">
          <Banner kind="info">
            This theme is unpublished. Publish it from the themes page to see changes on the live
            storefront. Saving settings still updates the theme document.
          </Banner>
        </div>
      ) : null}

      <form action={updateThemeSettings} className="grid gap-4 lg:grid-cols-3">
        <input type="hidden" name="shopSlug" value={shop.slug} />
        <input type="hidden" name="id" value={theme.id} />

        <div className="space-y-4 lg:col-span-2">
          <div className="card card-pad space-y-4">
            <h2 className="section-title">Brand</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Theme name</label>
                <input name="name" className="input" defaultValue={theme.name} />
              </div>
              <div>
                <label className="label">Preset</label>
                <select name="preset" className="input" defaultValue={config.preset}>
                  {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <p className="hint">Choosing a preset resets nav and accent colors.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Primary color</label>
                <input
                  name="primaryColor"
                  type="color"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white p-1"
                  defaultValue={config.colors.primary}
                />
              </div>
              <div>
                <label className="label">Background</label>
                <input
                  name="backgroundColor"
                  type="color"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white p-1"
                  defaultValue={config.colors.background}
                />
              </div>
              <div>
                <label className="label">Text color</label>
                <input
                  name="textColor"
                  type="color"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white p-1"
                  defaultValue={config.colors.text}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Heading font</label>
                <select name="headingFont" className="input" defaultValue={config.fonts.heading}>
                  <option value="sans">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>
              <div>
                <label className="label">Body font</label>
                <select name="bodyFont" className="input" defaultValue={config.fonts.body}>
                  <option value="sans">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card card-pad space-y-4">
            <h2 className="section-title">Hero section</h2>
            <div>
              <label className="label">Heading</label>
              <input name="heroHeading" className="input" defaultValue={config.hero.heading} />
            </div>
            <div>
              <label className="label">Subheading</label>
              <textarea
                name="heroSubheading"
                className="input min-h-[80px]"
                defaultValue={config.hero.subheading}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Button label</label>
                <input name="heroCta" className="input" defaultValue={config.hero.ctaLabel} />
              </div>
              <div>
                <label className="label">Hero image URL</label>
                <input name="heroImage" className="input" defaultValue={config.hero.image} />
              </div>
            </div>
          </div>

          <div className="card card-pad space-y-4">
            <h2 className="section-title">Announcement & footer</h2>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="announcementEnabled"
                defaultChecked={config.announcement.enabled}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Show announcement bar
            </label>
            <div>
              <label className="label">Announcement text</label>
              <input
                name="announcementText"
                className="input"
                defaultValue={config.announcement.text}
              />
            </div>
            <div>
              <label className="label">Footer tagline</label>
              <input name="footerText" className="input" defaultValue={config.footer.text} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
            <div
              className="overflow-hidden rounded-lg border p-4"
              style={{ background: config.colors.background, borderColor: config.colors.border }}
            >
              <p
                className="text-lg font-semibold leading-tight"
                style={{
                  color: config.colors.text,
                  fontFamily:
                    config.fonts.heading === "serif" ? "Georgia, serif" : "Inter, sans-serif"
                }}
              >
                {config.hero.heading}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: config.colors.muted }}>
                {config.hero.subheading}
              </p>
              <span
                className="mt-3 inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
                style={{ background: config.colors.primary }}
              >
                {config.hero.ctaLabel}
              </span>
              <div className="mt-4 flex gap-2 border-t pt-3" style={{ borderColor: config.colors.border }}>
                <div className="h-10 w-10 rounded" style={{ background: config.colors.surface }} />
                <div className="h-10 w-10 rounded" style={{ background: config.colors.accent }} />
                <div className="h-10 w-10 rounded" style={{ background: config.colors.primary }} />
              </div>
            </div>
          </div>
          <div className="card card-pad">
            <button type="submit" className="btn btn-primary w-full">
              Save theme
            </button>
            <Link
              href={`/admin/${shop.slug}/online-store/themes`}
              className="btn btn-ghost mt-2 w-full text-xs"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
