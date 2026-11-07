import type { ApiKey, Shop } from "@prisma/client";
import { prisma } from "./db";

export type ApiContext = { key: ApiKey; shop: Shop };

export async function authenticateApiRequest(request: Request): Promise<ApiContext | null> {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const token =
    bearer ||
    (request.headers.get("x-open-shopify-access-token") ?? "").trim() ||
    (request.headers.get("x-open-shopify-token") ?? "").trim();
  if (!token) return null;

  const key = await prisma.apiKey.findUnique({
    where: { token },
    include: { shop: true }
  });
  if (!key) return null;

  prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);

  return { key, shop: key.shop };
}

export function unauthorized(): Response {
  return Response.json(
    { errors: "Invalid or missing API token. Pass 'Authorization: Bearer <token>'." },
    { status: 401 }
  );
}

export function hasScope(key: ApiKey, scope: string): boolean {
  return key.scopes.split(",").map((s) => s.trim()).includes(scope);
}
