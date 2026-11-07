import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyExact, parseMoneyToCents, percent } from "./money";
import {
  computeDiscountAmount,
  computeTotals,
  isFreeShippingDiscount,
  validateDiscountCode,
  type DiscountLike
} from "./discounts";
import { formatBps, getPlanSeed, isWithinPlanLimit, planFeatures } from "./plans";
import { minVariantPrice, parseCollectionRules, productMatchesRules } from "./catalog";
import { parseThemeConfig, themeCssVars, DEFAULT_THEME } from "./theme";
import { renderTemplate, slugify, parseTags, tagsToCsv } from "./utils";

const NOW = new Date("2026-06-01T12:00:00Z");

function discount(overrides: Partial<DiscountLike> = {}): DiscountLike {
  return {
    code: "SAVE10",
    type: "PERCENTAGE",
    value: 10,
    minSubtotal: 0,
    usageLimit: null,
    usedCount: 0,
    startsAt: null,
    endsAt: null,
    status: "ACTIVE",
    ...overrides
  };
}

describe("money", () => {
  it("formats cents with and without decimals", () => {
    expect(formatMoney(1999)).toBe("$19.99");
    expect(formatMoney(1200)).toBe("$12");
    expect(formatMoneyExact(1200)).toBe("$12.00");
    expect(formatMoney(0, "EUR")).toBe("€0");
  });

  it("parses money inputs", () => {
    expect(parseMoneyToCents("$1,234.56")).toBe(123456);
    expect(parseMoneyToCents("19.99")).toBe(1999);
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("")).toBeNull();
  });

  it("computes percents", () => {
    expect(percent(25, 200)).toBe(12.5);
    expect(percent(1, 0)).toBe(0);
  });
});

describe("discounts", () => {
  it("validates active codes", () => {
    expect(validateDiscountCode(discount(), 5000, NOW)).toEqual({ ok: true });
    expect(validateDiscountCode(null, 5000, NOW).ok).toBe(false);
    expect(validateDiscountCode(discount({ status: "DISABLED" }), 5000, NOW).ok).toBe(false);
  });

  it("rejects expired, future and exhausted codes", () => {
    expect(validateDiscountCode(discount({ endsAt: new Date("2026-05-01") }), 5000, NOW).ok).toBe(false);
    expect(validateDiscountCode(discount({ startsAt: new Date("2026-07-01") }), 5000, NOW).ok).toBe(false);
    expect(
      validateDiscountCode(discount({ usageLimit: 5, usedCount: 5 }), 5000, NOW).ok
    ).toBe(false);
  });

  it("enforces minimum subtotal", () => {
    const result = validateDiscountCode(discount({ minSubtotal: 10000 }), 5000, NOW);
    expect(result.ok).toBe(false);
  });

  it("computes percentage, fixed and free shipping amounts", () => {
    expect(computeDiscountAmount({ type: "PERCENTAGE", value: 10 }, 5000)).toBe(500);
    expect(computeDiscountAmount({ type: "PERCENTAGE", value: 200 }, 5000)).toBe(5000);
    expect(computeDiscountAmount({ type: "FIXED", value: 1500 }, 5000)).toBe(1500);
    expect(computeDiscountAmount({ type: "FIXED", value: 9000 }, 5000)).toBe(5000);
    expect(computeDiscountAmount({ type: "FREE_SHIPPING", value: 0 }, 5000)).toBe(0);
    expect(isFreeShippingDiscount({ type: "FREE_SHIPPING" })).toBe(true);
    expect(isFreeShippingDiscount(null)).toBe(false);
  });

  it("computes totals with tax on discounted subtotal", () => {
    const totals = computeTotals({
      subtotal: 10000,
      discountAmount: 1000,
      freeShipping: false,
      shipping: 500,
      taxRatePct: 10,
      taxShipping: false
    });
    expect(totals).toEqual({
      subtotal: 10000,
      discountTotal: 1000,
      shippingTotal: 500,
      taxTotal: 900,
      total: 10400
    });
  });

  it("taxes shipping when configured and can zero shipping", () => {
    const totals = computeTotals({
      subtotal: 5000,
      discountAmount: 0,
      freeShipping: true,
      shipping: 800,
      taxRatePct: 8,
      taxShipping: true
    });
    expect(totals.shippingTotal).toBe(0);
    expect(totals.taxTotal).toBe(400);
    expect(totals.total).toBe(5400);
  });
});

describe("plans", () => {
  it("enforces finite limits and allows unlimited", () => {
    const starter = getPlanSeed("starter")!;
    expect(isWithinPlanLimit(starter, "products", 99)).toBe(true);
    expect(isWithinPlanLimit(starter, "products", 100)).toBe(false);
    expect(isWithinPlanLimit(starter, "staff", 1)).toBe(false);
    const plus = getPlanSeed("plus")!;
    expect(isWithinPlanLimit(plus, "staff", 500)).toBe(true);
  });

  it("exposes features and fee formatting", () => {
    const basic = getPlanSeed("basic")!;
    expect(planFeatures(basic).length).toBeGreaterThan(2);
    expect(formatBps(290)).toBe("2.90%");
    expect(formatBps(500)).toBe("5%");
  });
});

describe("catalog", () => {
  const product = {
    productType: "Apparel",
    vendor: "Northwind",
    tags: "cotton,new",
    minPrice: 3200
  };

  it("parses collection rules", () => {
    expect(parseCollectionRules('{"productType":"Apparel","priceMax":5000}')).toEqual({
      productType: "Apparel",
      priceMax: 5000
    });
    expect(parseCollectionRules("not-json")).toEqual({});
  });

  it("matches rules case-insensitively", () => {
    expect(productMatchesRules(product, { productType: "apparel" })).toBe(true);
    expect(productMatchesRules(product, { vendor: "northwind" })).toBe(true);
    expect(productMatchesRules(product, { tag: "NEW" })).toBe(true);
    expect(productMatchesRules(product, { tag: "sale" })).toBe(false);
    expect(productMatchesRules(product, { priceMin: 4000 })).toBe(false);
  });

  it("finds the minimum variant price", () => {
    expect(minVariantPrice([{ price: 500 }, { price: 250 }])).toBe(250);
    expect(minVariantPrice([])).toBe(0);
  });
});

describe("theme", () => {
  it("merges partial configs over defaults", () => {
    const config = parseThemeConfig(JSON.stringify({ colors: { primary: "#ff0000" } }));
    expect(config.colors.primary).toBe("#ff0000");
    expect(config.colors.background).toBe(DEFAULT_THEME.colors.background);
    expect(config.nav.length).toBeGreaterThan(0);
  });

  it("falls back on invalid JSON", () => {
    expect(parseThemeConfig("{oops").preset).toBe(DEFAULT_THEME.preset);
  });

  it("maps CSS variables", () => {
    const vars = themeCssVars(DEFAULT_THEME);
    expect(vars["--os-primary"]).toBe(DEFAULT_THEME.colors.primary);
    expect(vars["--os-font-heading"]).toContain("sans-serif");
  });
});

describe("utils", () => {
  it("slugifies", () => {
    expect(slugify("  Café Chair — Oak! ")).toBe("cafe-chair-oak");
  });

  it("handles tags", () => {
    expect(parseTags("Cotton, NEW ,,")).toEqual(["cotton", "new"]);
    expect(tagsToCsv(["Cotton", " NEW "])).toBe("cotton,new");
  });

  it("renders templates", () => {
    expect(renderTemplate("Hi {{name}}, order {{number}}", { name: "Ada", number: "#1001" })).toBe(
      "Hi Ada, order #1001"
    );
    expect(renderTemplate("Hello {{missing}}", {})).toBe("Hello {{missing}}");
  });
});
