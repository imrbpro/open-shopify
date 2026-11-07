import type { EmailMessage } from "@prisma/client";
import { prisma } from "./db";
import { getShopSettings, type ShopSettings } from "./settings";
import { signPayload } from "./webhooks";

export type QueueEmailInput = {
  shopId: string;
  to: string;
  subject: string;
  body: string;
  kind?: string;
};

async function deliverEmail(message: EmailMessage, settings: ShopSettings): Promise<void> {
  if (settings.emailProvider === "outbox") {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { status: "OUTBOX", provider: "outbox", sentAt: new Date(), error: null }
    });
    return;
  }

  if (settings.emailProvider === "resend") {
    if (!settings.resendApiKey || !settings.emailFrom) {
      await prisma.emailMessage.update({
        where: { id: message.id },
        data: {
          status: "FAILED",
          provider: "resend",
          error: "Add a Resend API key and from address in Settings → Integrations."
        }
      });
      return;
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${settings.resendApiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          from: settings.emailFrom,
          to: [message.to],
          subject: message.subject,
          text: message.body,
          ...(settings.emailReplyTo ? { reply_to: settings.emailReplyTo } : {})
        }),
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Resend responded ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ""}`);
      }
      await prisma.emailMessage.update({
        where: { id: message.id },
        data: { status: "SENT", provider: "resend", sentAt: new Date(), error: null }
      });
    } catch (error) {
      await prisma.emailMessage.update({
        where: { id: message.id },
        data: {
          status: "FAILED",
          provider: "resend",
          error: error instanceof Error ? error.message.slice(0, 500) : "Delivery failed."
        }
      });
    }
    return;
  }

  if (!settings.emailWebhookUrl) {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: {
        status: "FAILED",
        provider: "webhook",
        error: "Add an email webhook URL in Settings → Integrations."
      }
    });
    return;
  }

  try {
    const payload = JSON.stringify({
      to: message.to,
      subject: message.subject,
      text: message.body,
      kind: message.kind,
      shopId: message.shopId
    });
    const response = await fetch(settings.emailWebhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(settings.emailWebhookSecret
          ? { "x-openstore-signature": signPayload(payload, settings.emailWebhookSecret) }
          : {})
      },
      body: payload,
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`Webhook responded ${response.status}`);
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { status: "SENT", provider: "webhook", sentAt: new Date(), error: null }
    });
  } catch (error) {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: {
        status: "FAILED",
        provider: "webhook",
        error: error instanceof Error ? error.message.slice(0, 500) : "Delivery failed."
      }
    });
  }
}

export async function queueEmail(input: QueueEmailInput): Promise<EmailMessage> {
  const settings = await getShopSettings(input.shopId);
  const message = await prisma.emailMessage.create({
    data: {
      shopId: input.shopId,
      to: input.to,
      subject: input.subject,
      body: input.body,
      kind: input.kind ?? "order_confirmation",
      status: "QUEUED",
      provider: settings.emailProvider
    }
  });

  try {
    await deliverEmail(message, settings);
  } catch {
    await prisma.emailMessage
      .update({
        where: { id: message.id },
        data: { status: "FAILED", error: "Unexpected delivery error." }
      })
      .catch(() => undefined);
  }

  return prisma.emailMessage.findUniqueOrThrow({ where: { id: message.id } });
}
