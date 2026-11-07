"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { serializeThemeConfig, THEME_PRESETS } from "@/lib/theme";
import { BUILTIN_APPS } from "@/lib/apps";
import { DEFAULT_SETTINGS, serializeSetting } from "@/lib/settings-defaults";
import type { FormState } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signupSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  shopName: z.string().min(2, "Enter a store name.").max(60)
});

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function uniqueShopSlug(base: string): Promise<string> {
  const root = slugify(base) || "shop";
  let candidate = root;
  let counter = 1;
  while (await prisma.shop.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${counter++}`;
    if (counter > 500) throw new Error("Could not allocate a store handle.");
  }
  return candidate;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: getString(formData, "email").toLowerCase(),
    password: getString(formData, "password")
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { error: "Invalid email or password." };

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  await createSession(user.id);

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { shop: true },
    orderBy: { createdAt: "asc" }
  });

  redirect(membership ? `/admin/${membership.shop.slug}` : "/admin");
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email").toLowerCase(),
    password: getString(formData, "password"),
    shopName: getString(formData, "shopName")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with that email already exists. Try logging in." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const slug = await uniqueShopSlug(parsed.data.shopName);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: parsed.data.email, name: parsed.data.name, passwordHash }
    });
    const shop = await tx.shop.create({
      data: {
        name: parsed.data.shopName,
        slug,
        email: parsed.data.email,
        description: "",
        currency: "USD",
        country: "US",
        timezone: "America/Los_Angeles"
      }
    });
    await tx.membership.create({
      data: { userId: user.id, shopId: shop.id, role: "OWNER" }
    });
    for (const [preset, definition] of Object.entries(THEME_PRESETS)) {
      await tx.theme.create({
        data: {
          shopId: shop.id,
          name: definition.name,
          role: preset === "classic" ? "MAIN" : "UNPUBLISHED",
          preset,
          configJson: serializeThemeConfig(definition.config)
        }
      });
    }
    for (const app of BUILTIN_APPS) {
      await tx.app.upsert({ where: { id: app.id }, create: app, update: app });
      await tx.appInstallation.create({
        data: { shopId: shop.id, appId: app.id, status: "ACTIVE" }
      });
    }
    await tx.shopSetting.createMany({
      data: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        shopId: shop.id,
        key,
        value: serializeSetting(key, value as string | number | boolean)
      }))
    });
    await tx.shippingRate.createMany({
      data: [
        { shopId: shop.id, name: "Standard shipping", price: 500, minSubtotal: 7500 },
        { shopId: shop.id, name: "Express shipping", price: 1500, minSubtotal: 0 },
        { shopId: shop.id, name: "Local pickup", price: 0, minSubtotal: 0 }
      ]
    });
    return { user, shop };
  });

  await createSession(result.user.id);
  redirect(`/admin/${result.shop.slug}?created=1`);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
