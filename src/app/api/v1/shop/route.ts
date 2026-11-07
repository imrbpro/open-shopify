import { prisma } from "@/lib/db";
import { authenticateApiRequest, unauthorized } from "@/lib/api-auth";
import { getShopSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const context = await authenticateApiRequest(request);
  if (!context) return unauthorized();

  const { shop, key } = context;
  const [settings, themes, installations] = await Promise.all([
    getShopSettings(shop.id),
    prisma.theme.findMany({ where: { shopId: shop.id }, select: { name: true, role: true, preset: true } }),
    prisma.appInstallation.findMany({
      where: { shopId: shop.id, status: "ACTIVE" },
      include: { app: { select: { handle: true, name: true } } }
    })
  ]);

  return Response.json({
    shop: {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      email: shop.email,
      description: shop.description,
      currency: shop.currency,
      country: shop.country,
      timezone: shop.timezone,
      paymentProvider: settings.paymentProvider,
      emailProvider: settings.emailProvider,
      analyticsProvider: settings.analyticsProvider
    },
    theme: themes.find((theme) => theme.role === "MAIN") ?? themes[0] ?? null,
    apps: installations.map((installation) => ({
      handle: installation.app.handle,
      name: installation.app.name
    })),
    key: { label: key.label, scopes: key.scopes.split(",").map((scope) => scope.trim()) }
  });
}
