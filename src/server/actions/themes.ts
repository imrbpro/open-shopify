"use server";

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireShop } from "@/lib/auth";
import {
  serializeThemeConfig,
  THEME_PRESETS,
  type ThemeConfig,
  type ThemeFont
} from "@/lib/theme";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function hex(input: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(input) ? input : fallback;
}

function font(input: string, fallback: ThemeFont): ThemeFont {
  return input === "sans" || input === "serif" || input === "mono" ? input : fallback;
}

export async function activateTheme(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const theme = await prisma.theme.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!theme) notFound();

  await prisma.$transaction([
    prisma.theme.updateMany({ where: { shopId: shop.id }, data: { role: "UNPUBLISHED" } }),
    prisma.theme.update({ where: { id: theme.id }, data: { role: "MAIN" } })
  ]);

  redirect(`/admin/${shop.slug}/online-store/themes?activated=1`);
}

export async function updateThemeSettings(formData: FormData): Promise<void> {
  const shopSlug = text(formData, "shopSlug");
  const { shop } = await requireShop(shopSlug);
  const theme = await prisma.theme.findFirst({
    where: { id: text(formData, "id"), shopId: shop.id }
  });
  if (!theme) notFound();

  const presetKey = THEME_PRESETS[text(formData, "preset")]
    ? text(formData, "preset")
    : theme.preset;
  const base = JSON.parse(
    JSON.stringify(THEME_PRESETS[presetKey]?.config ?? THEME_PRESETS.classic.config)
  ) as ThemeConfig;

  const config: ThemeConfig = {
    ...base,
    preset: presetKey,
    colors: {
      ...base.colors,
      primary: hex(text(formData, "primaryColor"), base.colors.primary),
      background: hex(text(formData, "backgroundColor"), base.colors.background),
      text: hex(text(formData, "textColor"), base.colors.text)
    },
    fonts: {
      heading: font(text(formData, "headingFont"), base.fonts.heading),
      body: font(text(formData, "bodyFont"), base.fonts.body)
    },
    hero: {
      heading: text(formData, "heroHeading") || base.hero.heading,
      subheading: text(formData, "heroSubheading") || base.hero.subheading,
      ctaLabel: text(formData, "heroCta") || base.hero.ctaLabel,
      image: text(formData, "heroImage") || base.hero.image
    },
    announcement: {
      enabled: formData.get("announcementEnabled") === "on",
      text: text(formData, "announcementText") || base.announcement.text
    },
    footer: {
      text: text(formData, "footerText") || base.footer.text
    }
  };

  await prisma.theme.update({
    where: { id: theme.id },
    data: {
      preset: presetKey,
      name: text(formData, "name") || theme.name,
      configJson: serializeThemeConfig(config)
    }
  });

  redirect(`/admin/${shop.slug}/online-store/themes/${theme.id}?saved=1`);
}
