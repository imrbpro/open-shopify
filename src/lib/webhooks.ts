import { createHmac, randomBytes } from "crypto";
import { prisma } from "./db";

export const WEBHOOK_TOPICS = [
  "orders/create",
  "orders/paid",
  "orders/fulfilled",
  "orders/cancelled",
  "orders/refunded",
  "products/create",
  "products/update",
  "products/delete",
  "customers/create",
  "app/uninstalled"
] as const;

export type WebhookTopic = (typeof WEBHOOK_TOPICS)[number];

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export async function dispatchWebhooks(
  shopSlug: string,
  shopId: string,
  topic: string,
  data: unknown
): Promise<void> {
  const hooks = await prisma.webhook.findMany({
    where: { shopId, topic, active: true }
  });
  if (hooks.length === 0) return;

  const payload = JSON.stringify({
    topic,
    shop: shopSlug,
    triggered_at: new Date().toISOString(),
    data
  });

  await Promise.allSettled(
    hooks.map(async (hook) => {
      let responseCode: number | null = null;
      let error: string | null = null;
      try {
        const response = await fetch(hook.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-openstore-topic": topic,
            "x-openstore-hmac-sha256": signPayload(payload, hook.secret)
          },
          body: payload,
          signal: AbortSignal.timeout(5000)
        });
        responseCode = response.status;
      } catch (err) {
        error = err instanceof Error ? err.message : "Request failed";
      }
      try {
        await prisma.webhookDelivery.create({
          data: {
            webhookId: hook.id,
            topic,
            url: hook.url,
            responseCode,
            error
          }
        });
      } catch {
        // delivery logging must never break the primary flow
      }
    })
  );
}
