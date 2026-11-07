import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "open-shopify — open-source commerce platform",
    template: "%s · open-shopify"
  },
  description:
    "A reverse-engineered, open-source commerce platform: multi-tenant stores, admin, checkout, themes, apps, plans and billing."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
