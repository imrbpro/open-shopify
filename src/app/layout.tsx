import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OpenStore — open-source commerce platform",
    template: "%s · OpenStore"
  },
  description:
    "An independent open-source commerce platform: multi-tenant stores, admin, checkout, six themes, built-in apps and provider-agnostic payments, email and analytics."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
