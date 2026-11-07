export type CollectionRules = {
  productType?: string;
  vendor?: string;
  tag?: string;
  priceMin?: number;
  priceMax?: number;
};

export function parseCollectionRules(json: string | null | undefined): CollectionRules {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return {};
    const rules: CollectionRules = {};
    if (typeof parsed.productType === "string" && parsed.productType) rules.productType = parsed.productType;
    if (typeof parsed.vendor === "string" && parsed.vendor) rules.vendor = parsed.vendor;
    if (typeof parsed.tag === "string" && parsed.tag) rules.tag = parsed.tag;
    if (typeof parsed.priceMin === "number" && Number.isFinite(parsed.priceMin)) rules.priceMin = parsed.priceMin;
    if (typeof parsed.priceMax === "number" && Number.isFinite(parsed.priceMax)) rules.priceMax = parsed.priceMax;
    return rules;
  } catch {
    return {};
  }
}

export type RuleProduct = {
  productType: string;
  vendor: string;
  tags: string;
  minPrice: number;
};

export function productMatchesRules(product: RuleProduct, rules: CollectionRules): boolean {
  if (rules.productType && product.productType.toLowerCase() !== rules.productType.toLowerCase()) return false;
  if (rules.vendor && product.vendor.toLowerCase() !== rules.vendor.toLowerCase()) return false;
  if (rules.tag) {
    const tags = product.tags.split(",").map((tag) => tag.trim().toLowerCase());
    if (!tags.includes(rules.tag.toLowerCase())) return false;
  }
  if (rules.priceMin !== undefined && product.minPrice < rules.priceMin) return false;
  if (rules.priceMax !== undefined && product.minPrice > rules.priceMax) return false;
  return true;
}

export function minVariantPrice(variants: { price: number }[]): number {
  if (variants.length === 0) return 0;
  return Math.min(...variants.map((variant) => variant.price));
}
