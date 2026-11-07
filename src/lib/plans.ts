export type PlanCode = "starter" | "basic" | "shopify" | "advanced" | "plus";

export type PlanSeed = {
  id: string;
  code: PlanCode;
  name: string;
  description: string;
  priceMonthly: number;
  trialDays: number;
  productLimit: number | null;
  staffLimit: number | null;
  transactionFeeBps: number;
  cardRateBps: number;
  cardFixedCents: number;
  features: string[];
  sortOrder: number;
};

export const PLAN_SEEDS: PlanSeed[] = [
  {
    id: "starter",
    code: "starter",
    name: "Starter",
    description: "Sell in person and online with a lightweight storefront.",
    priceMonthly: 500,
    trialDays: 14,
    productLimit: 100,
    staffLimit: 1,
    transactionFeeBps: 500,
    cardRateBps: 290,
    cardFixedCents: 30,
    features: [
      "Online store and checkout",
      "Up to 100 products",
      "1 staff account",
      "Discount codes",
      "5% third-party transaction fee",
      "2.9% + 30¢ online card rate"
    ],
    sortOrder: 1
  },
  {
    id: "basic",
    code: "basic",
    name: "Basic",
    description: "Everything you need to start selling at scale.",
    priceMonthly: 3900,
    trialDays: 14,
    productLimit: null,
    staffLimit: 5,
    transactionFeeBps: 200,
    cardRateBps: 290,
    cardFixedCents: 30,
    features: [
      "Everything in Starter",
      "Unlimited products",
      "5 staff accounts",
      "Professional reports",
      "2% third-party transaction fee",
      "24/7 chat support"
    ],
    sortOrder: 2
  },
  {
    id: "shopify",
    code: "shopify",
    name: "Shopify",
    description: "For growing businesses that need deeper reporting.",
    priceMonthly: 10500,
    trialDays: 14,
    productLimit: null,
    staffLimit: 15,
    transactionFeeBps: 100,
    cardRateBps: 260,
    cardFixedCents: 30,
    features: [
      "Everything in Basic",
      "15 staff accounts",
      "5 additional reporting dashboards",
      "1% third-party transaction fee",
      "Lower card rates (2.6% + 30¢)",
      "Shipping discount up to 88%"
    ],
    sortOrder: 3
  },
  {
    id: "advanced",
    code: "advanced",
    name: "Advanced",
    description: "Scale with custom reports and lower transaction fees.",
    priceMonthly: 39900,
    trialDays: 14,
    productLimit: null,
    staffLimit: 50,
    transactionFeeBps: 50,
    cardRateBps: 240,
    cardFixedCents: 30,
    features: [
      "Everything in Shopify",
      "50 staff accounts",
      "Custom report builder",
      "0.5% third-party transaction fee",
      "Third-party calculated shipping rates",
      "Priority support"
    ],
    sortOrder: 4
  },
  {
    id: "plus",
    code: "plus",
    name: "Plus",
    description: "Enterprise commerce with the highest level of support.",
    priceMonthly: 230000,
    trialDays: 14,
    productLimit: null,
    staffLimit: null,
    transactionFeeBps: 15,
    cardRateBps: 215,
    cardFixedCents: 30,
    features: [
      "Everything in Advanced",
      "Unlimited staff accounts",
      "Shopify Plus features",
      "0.15% third-party transaction fee",
      "Dedicated launch manager",
      "99.99% uptime SLA"
    ],
    sortOrder: 5
  }
];

export function getPlanSeed(code: string): PlanSeed | undefined {
  return PLAN_SEEDS.find((p) => p.code === code || p.id === code);
}

export function isWithinPlanLimit(
  plan: { productLimit: number | null; staffLimit?: number | null },
  resource: "products" | "staff",
  currentCount: number
): boolean {
  const limit = resource === "products" ? plan.productLimit : plan.staffLimit ?? null;
  if (limit === null || limit === undefined) return true;
  return currentCount < limit;
}

export function planFeatures(plan: { features: string | string[] }): string[] {
  if (Array.isArray(plan.features)) return plan.features.filter(Boolean);
  return plan.features.split("\n").filter(Boolean);
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}
