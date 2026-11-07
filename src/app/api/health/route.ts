import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  let database = "ok";
  try {
    await prisma.shop.count();
  } catch {
    database = "unavailable";
  }
  return Response.json(
    {
      status: database === "ok" ? "ok" : "degraded",
      app: "open-shopify",
      database,
      time: new Date().toISOString()
    },
    { status: database === "ok" ? 200 : 503 }
  );
}
