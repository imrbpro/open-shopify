export const PAYMENT_PROVIDERS = ["simulated", "manual", "stripe", "custom"] as const;
export const EMAIL_PROVIDERS = ["outbox", "resend", "webhook"] as const;
export const ANALYTICS_PROVIDERS = ["none", "ga4", "gtm", "plausible", "custom"] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];
export type AnalyticsProvider = (typeof ANALYTICS_PROVIDERS)[number];

export type ShopSettings = {
  taxRatePct: number;
  taxShipping: boolean;
  paymentProvider: PaymentProvider;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  customPaymentName: string;
  customPaymentUrl: string;
  customPaymentSecret: string;
  checkoutNote: string;
  lowStockThreshold: number;
  emailProvider: EmailProvider;
  emailFrom: string;
  emailReplyTo: string;
  resendApiKey: string;
  emailWebhookUrl: string;
  emailWebhookSecret: string;
  orderConfirmationSubject: string;
  orderConfirmationBody: string;
  shippingEmailSubject: string;
  shippingEmailBody: string;
  newsletterEnabled: boolean;
  analyticsProvider: AnalyticsProvider;
  gaMeasurementId: string;
  gtmContainerId: string;
  plausibleDomain: string;
  customAnalyticsScriptUrl: string;
};

export const DEFAULT_SETTINGS: ShopSettings = {
  taxRatePct: 0,
  taxShipping: false,
  paymentProvider: "simulated",
  stripePublishableKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  customPaymentName: "Pay by bank transfer",
  customPaymentUrl: "",
  customPaymentSecret: "",
  checkoutNote: "Thanks for shopping with us.",
  lowStockThreshold: 5,
  emailProvider: "outbox",
  emailFrom: "",
  emailReplyTo: "",
  resendApiKey: "",
  emailWebhookUrl: "",
  emailWebhookSecret: "",
  orderConfirmationSubject: "Order {{order_number}} confirmed — {{shop_name}}",
  orderConfirmationBody:
    "Hi {{customer_name}},\n\nThanks for your order! We're getting {{order_number}} ready now.\n\nOrder total: {{total}}\n\nWe'll email you again when it ships.\n\n— {{shop_name}}",
  shippingEmailSubject: "Your order {{order_number}} is on the way",
  shippingEmailBody:
    "Hi {{customer_name}},\n\nGood news — your order {{order_number}} just shipped.\n\nTracking: {{tracking_number}} ({{tracking_company}})\n\n— {{shop_name}}",
  newsletterEnabled: true,
  analyticsProvider: "none",
  gaMeasurementId: "",
  gtmContainerId: "",
  plausibleDomain: "",
  customAnalyticsScriptUrl: ""
};

const BOOLEAN_KEYS: (keyof ShopSettings)[] = [
  "taxShipping",
  "newsletterEnabled"
];

const NUMBER_KEYS: (keyof ShopSettings)[] = ["taxRatePct", "lowStockThreshold"];

const ENUM_KEYS: Partial<Record<keyof ShopSettings, readonly string[]>> = {
  paymentProvider: PAYMENT_PROVIDERS,
  emailProvider: EMAIL_PROVIDERS,
  analyticsProvider: ANALYTICS_PROVIDERS
};

export function serializeSetting(key: string, value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function parseSettings(rows: { key: string; value: string }[]): ShopSettings {
  const result: ShopSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const key = row.key as keyof ShopSettings;
    if (!(key in result)) continue;
    if (BOOLEAN_KEYS.includes(key)) {
      (result[key] as boolean) = row.value === "true";
    } else if (NUMBER_KEYS.includes(key)) {
      const num = Number(row.value);
      if (Number.isFinite(num)) (result[key] as number) = num;
    } else if (ENUM_KEYS[key]) {
      if (ENUM_KEYS[key]!.includes(row.value)) {
        (result[key] as string) = row.value;
      }
    } else {
      (result[key] as string) = row.value;
    }
  }
  return result;
}
