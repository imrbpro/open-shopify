export type ShopSettings = {
  taxRatePct: number;
  taxShipping: boolean;
  manualPayment: boolean;
  cardPayment: boolean;
  checkoutNote: string;
  lowStockThreshold: number;
  orderConfirmationSubject: string;
  orderConfirmationBody: string;
  shippingEmailSubject: string;
  shippingEmailBody: string;
  newsletterEnabled: boolean;
};

export const DEFAULT_SETTINGS: ShopSettings = {
  taxRatePct: 0,
  taxShipping: false,
  manualPayment: true,
  cardPayment: true,
  checkoutNote: "Thanks for shopping with us.",
  lowStockThreshold: 5,
  orderConfirmationSubject: "Order {{order_number}} confirmed — {{shop_name}}",
  orderConfirmationBody:
    "Hi {{customer_name}},\n\nThanks for your order! We're getting {{order_number}} ready now.\n\nOrder total: {{total}}\n\nWe'll email you again when it ships.\n\n— {{shop_name}}",
  shippingEmailSubject: "Your order {{order_number}} is on the way",
  shippingEmailBody:
    "Hi {{customer_name}},\n\nGood news — your order {{order_number}} just shipped.\n\nTracking: {{tracking_number}} ({{tracking_company}})\n\n— {{shop_name}}",
  newsletterEnabled: true
};

const BOOLEAN_KEYS: (keyof ShopSettings)[] = [
  "taxShipping",
  "manualPayment",
  "cardPayment",
  "newsletterEnabled"
];

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
    } else if (key === "taxRatePct" || key === "lowStockThreshold") {
      const num = Number(row.value);
      if (Number.isFinite(num)) (result[key] as number) = num;
    } else {
      (result[key] as string) = row.value;
    }
  }
  return result;
}
