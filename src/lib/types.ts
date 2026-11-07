export type FormState = { error?: string; success?: string } | undefined;

export type CartItemInput = {
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
};

export type CartLine = CartItemInput & {
  key: string;
};

export type ActionState = FormState;

export type CheckoutState = { error?: string; orderNumber?: number } | undefined;

export type DiscountPreview =
  | { ok: false; error: string }
  | {
      ok: true;
      code: string;
      type: string;
      value: number;
      amount: number;
      freeShipping: boolean;
    };

export type ThemeSettingsInput = {
  preset: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  heroHeading: string;
  heroSubheading: string;
  heroCta: string;
  heroImage: string;
  announcementEnabled: boolean;
  announcementText: string;
  footerText: string;
  headingFont: "sans" | "serif" | "mono";
  bodyFont: "sans" | "serif" | "mono";
};
