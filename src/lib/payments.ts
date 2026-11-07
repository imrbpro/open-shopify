import { createHmac, timingSafeEqual } from "crypto";
import { signPayload } from "./webhooks";

type StripeSessionInput = {
  secretKey: string;
  orderId: string;
  orderNumber: number;
  shopName: string;
  currency: string;
  totalCents: number;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

type StripeSessionResult =
  | { ok: true; id: string; url: string }
  | { ok: false; error: string };

type StripeSessionLookup =
  | { ok: true; orderId: string | null; paymentStatus: string; status: string }
  | { ok: false; error: string };

function stripeError(payload: unknown): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: string } }).error;
    if (error?.message) return error.message;
  }
  return "Stripe request failed.";
}

export async function createStripeCheckoutSession(
  input: StripeSessionInput
): Promise<StripeSessionResult> {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", input.successUrl);
  body.set("cancel_url", input.cancelUrl);
  body.set("customer_email", input.customerEmail);
  body.set("client_reference_id", input.orderId);
  body.set("metadata[orderId]", input.orderId);
  body.set("payment_intent_data[metadata][orderId]", input.orderId);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", input.currency.toLowerCase());
  body.set("line_items[0][price_data][unit_amount]", String(input.totalCents));
  body.set(
    "line_items[0][price_data][product_data][name]",
    `Order #${input.orderNumber} — ${input.shopName}`
  );

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
        "idempotency-key": `openstore-checkout-${input.orderId}`
      },
      body,
      signal: AbortSignal.timeout(15000)
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: stripeError(payload) };
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof (payload as { id?: unknown }).id !== "string" ||
      typeof (payload as { url?: unknown }).url !== "string"
    ) {
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }
    return {
      ok: true,
      id: (payload as { id: string }).id,
      url: (payload as { url: string }).url
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reach Stripe."
    };
  }
}

export async function retrieveStripeSession(
  sessionId: string,
  secretKey: string
): Promise<StripeSessionLookup> {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { authorization: `Bearer ${secretKey}` },
        signal: AbortSignal.timeout(15000)
      }
    );
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: stripeError(payload) };
    const record = payload as {
      metadata?: { orderId?: string };
      client_reference_id?: string;
      payment_status?: string;
      status?: string;
    };
    return {
      ok: true,
      orderId: record.metadata?.orderId ?? record.client_reference_id ?? null,
      paymentStatus: record.payment_status ?? "unpaid",
      status: record.status ?? "open"
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reach Stripe."
    };
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyStripeSignature(input: {
  payload: string;
  signatureHeader: string | null;
  secret: string;
  toleranceSeconds?: number;
}): boolean {
  if (!input.signatureHeader || !input.secret) return false;
  const pieces = input.signatureHeader.split(",").map((piece) => piece.trim());
  const timestamp = pieces.find((piece) => piece.startsWith("t="))?.slice(2);
  const signatures = pieces
    .filter((piece) => piece.startsWith("v1="))
    .map((piece) => piece.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;
  const tolerance = input.toleranceSeconds ?? 300;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > tolerance) return false;

  const expected = createHmac("sha256", input.secret)
    .update(`${timestamp}.${input.payload}`, "utf8")
    .digest("hex");
  return signatures.some((signature) => safeEqual(signature, expected));
}

export function verifySignedPayload(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  return safeEqual(signature, signPayload(payload, secret));
}

export function paymentCancelToken(orderId: string): string {
  const secret = process.env.AUTH_SECRET ?? "openstore-dev-secret-change-me";
  return signPayload(`cancel:${orderId}`, secret);
}

export function verifyPaymentCancelToken(orderId: string, token: string | null): boolean {
  if (!token) return false;
  return safeEqual(token, paymentCancelToken(orderId));
}

export function buildCustomPaymentUrl(input: {
  baseUrl: string;
  secret: string;
  orderId: string;
  orderNumber: number;
  amount: number;
  currency: string;
  email: string;
  returnUrl: string;
  cancelUrl: string;
}): string | null {
  if (!input.baseUrl) return null;
  let url: URL;
  try {
    url = new URL(input.baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
  } catch {
    return null;
  }

  const params = new URLSearchParams();
  params.set("order", input.orderId);
  params.set("order_number", String(input.orderNumber));
  params.set("amount", String(input.amount));
  params.set("currency", input.currency);
  params.set("email", input.email);
  params.set("return_url", input.returnUrl);
  params.set("cancel_url", input.cancelUrl);

  if (input.secret) {
    params.set("signature", signPayload(params.toString(), input.secret));
  }
  url.search = params.toString();
  return url.toString();
}
