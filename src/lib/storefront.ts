import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "./db";
import { parseSettings, type ShopSettings } from "./settings-defaults";
import { parseThemeConfig, type ThemeConfig } from "./theme";

export const getStore = cache(async (slug: string) => {
  const shop = await prisma.shop.findUnique({
    where: { slug },
    include: {
      subscription: { include: { plan: true } },
      themes: true,
      settings: true,
      appInstallations: { include: { app: true }, where: { status: "ACTIVE" } }
    }
  });
  if (!shop) notFound();

  const theme = shop.themes.find((entry) => entry.role === "MAIN") ?? shop.themes[0];
  const config = parseThemeConfig(theme?.configJson);
  const settings: ShopSettings = parseSettings(shop.settings);
  const apps = new Set(shop.appInstallations.map((install) => install.app.handle));

  return { shop, theme, config, settings, apps };
});

export type StoreContext = Awaited<ReturnType<typeof getStore>>;

export function isStoreOffline(store: StoreContext): boolean {
  return store.shop.subscription?.status === "CANCELLED";
}

export function isAppInstalled(store: StoreContext, handle: string): boolean {
  return store.apps.has(handle);
}

export function storeHref(slug: string, path: string): string {
  if (!path) return `/s/${slug}`;
  if (path.startsWith("http") || path.startsWith("#")) return path;
  return `/s/${slug}${path.startsWith("/") ? "" : "/"}${path}`;
}

export type StoreThemeConfig = ThemeConfig;
