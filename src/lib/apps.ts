export type BuiltinApp = {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  description: string;
  category: string;
  developer: string;
  color: string;
  priceLabel: string;
  rating: number;
  installs: number;
  capabilities: string;
};

export const BUILTIN_APPS: BuiltinApp[] = [
  {
    id: "product-reviews",
    name: "Product Reviews",
    handle: "product-reviews",
    tagline: "Collect and display customer reviews.",
    description:
      "Add star ratings, written reviews and a review form to every product page. Reviews are stored in your own database and published instantly.",
    category: "Marketing",
    developer: "OpenStore",
    color: "#0f766e",
    priceLabel: "Included",
    rating: 50,
    installs: 0,
    capabilities: "reviews"
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    handle: "email-marketing",
    tagline: "Grow your list from the storefront.",
    description:
      "Collect newsletter signups in the storefront footer and keep every subscriber in your customer list. Delivery is handled by the email provider you configure.",
    category: "Marketing",
    developer: "OpenStore",
    color: "#0f172a",
    priceLabel: "Included",
    rating: 50,
    installs: 0,
    capabilities: "newsletter"
  },
  {
    id: "wishlist",
    name: "Wishlist",
    handle: "wishlist",
    tagline: "Let shoppers save products for later.",
    description:
      "Adds a saved-items button to every product card and product page, a wishlist page for each shopper and a header shortcut. Stored in the browser.",
    category: "Storefront",
    developer: "OpenStore",
    color: "#be123c",
    priceLabel: "Included",
    rating: 50,
    installs: 0,
    capabilities: "wishlist"
  },
  {
    id: "recently-viewed",
    name: "Recently Viewed",
    handle: "recently-viewed",
    tagline: "Bring shoppers back to what caught their eye.",
    description:
      "Tracks the products each shopper views and shows a recently viewed rail on product pages and in the storefront. Stored in the browser.",
    category: "Storefront",
    developer: "OpenStore",
    color: "#7c3aed",
    priceLabel: "Included",
    rating: 50,
    installs: 0,
    capabilities: "recently-viewed"
  }
];

export const BUILTIN_APP_HANDLES = BUILTIN_APPS.map((app) => app.handle);

export function isBuiltinApp(handle: string): boolean {
  return BUILTIN_APP_HANDLES.includes(handle);
}
