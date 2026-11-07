import { prisma } from "@/lib/db";
import { authenticateApiRequest, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const context = await authenticateApiRequest(request);
  if (!context) return unauthorized();

  const { shop, key } = context;
  const subscription = await prisma.subscription.findUnique({
    where: { shopId: shop.id },
    include: { plan: true }
  });

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
      plan: subscription?.plan.name ?? null
    },
    key: { label: key.label, scopes: key.scopes.split(",").map((scope) => scope.trim()) }
  });
}
