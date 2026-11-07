import Link from "next/link";
import type { StoreContext } from "@/lib/storefront";
import { isAppInstalled, storeHref } from "@/lib/storefront";
import { CartBadge } from "./cart-badge";
import { NewsletterForm } from "./newsletter-form";
import { WishlistBadge } from "./wishlist";
import { Icon } from "@/components/icons";

export function StoreHeader({ store }: { store: StoreContext }) {
  const { shop, config } = store;
  const links = config.nav.map((item) => ({ label: item.label, href: storeHref(shop.slug, item.href) }));
  const showWishlist = isAppInstalled(store, "wishlist");

  return (
    <header className="border-b store-border" style={{ background: "var(--os-bg)" }}>
      {config.announcement.enabled ? (
        <div
          className="px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ background: "var(--os-accent)", color: "var(--os-text)" }}
        >
          {config.announcement.text}
        </div>
      ) : null}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href={`/s/${shop.slug}`} className="store-heading text-lg font-semibold tracking-tight">
          {shop.name}
        </Link>
        <nav className="hidden items-center gap-5 md:flex" aria-label="Storefront">
          {links.map((link) => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="text-sm font-medium transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={`/s/${shop.slug}/search`}
            aria-label="Search"
            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80 store-border"
          >
            <Icon name="search" className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Link>
          {showWishlist ? <WishlistBadge slug={shop.slug} /> : null}
          <CartBadge slug={shop.slug} />
        </div>
      </div>
      <div className="scrollbar-thin flex gap-4 overflow-x-auto border-t px-4 py-2 md:hidden store-border">
        {links.map((link) => (
          <Link
            key={`mobile-${link.label}-${link.href}`}
            href={link.href}
            className="shrink-0 text-xs font-medium"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

export function StoreFooter({ store }: { store: StoreContext }) {
  const { shop, config, settings } = store;
  const showNewsletter = settings.newsletterEnabled && isAppInstalled(store, "email-marketing");
  const showWishlist = isAppInstalled(store, "wishlist");
  const links = config.nav.map((item) => ({ label: item.label, href: storeHref(shop.slug, item.href) }));

  return (
    <footer className="mt-16 border-t store-border" style={{ background: "var(--os-surface)" }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="store-heading text-lg font-semibold">{shop.name}</p>
          <p className="mt-2 max-w-xs text-sm store-muted">{config.footer.text}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide store-muted">Shop</p>
          <ul className="mt-3 space-y-2">
            {links.map((link) => (
              <li key={`foot-${link.label}-${link.href}`}>
                <Link href={link.href} className="text-sm transition-opacity hover:opacity-70">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide store-muted">Help</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href={`/s/${shop.slug}/order-lookup`} className="text-sm transition-opacity hover:opacity-70">
                Order lookup
              </Link>
            </li>
            {showWishlist ? (
              <li>
                <Link href={`/s/${shop.slug}/wishlist`} className="text-sm transition-opacity hover:opacity-70">
                  Wishlist
                </Link>
              </li>
            ) : null}
            <li>
              <Link href={`/s/${shop.slug}/pages/contact`} className="text-sm transition-opacity hover:opacity-70">
                Contact
              </Link>
            </li>
            <li>
              <Link href={`/s/${shop.slug}/pages/shipping-returns`} className="text-sm transition-opacity hover:opacity-70">
                Shipping & returns
              </Link>
            </li>
            <li>
              <a href={`mailto:${shop.email}`} className="text-sm transition-opacity hover:opacity-70">
                {shop.email}
              </a>
            </li>
          </ul>
        </div>
        {showNewsletter ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide store-muted">Newsletter</p>
            <p className="mt-3 text-sm store-muted">New arrivals and stories, once a month.</p>
            <div className="mt-3">
              <NewsletterForm slug={shop.slug} />
            </div>
          </div>
        ) : null}
      </div>
      <div className="border-t store-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[11px] store-muted">
          <span>
            © {new Date().getFullYear()} {shop.name}. All rights reserved.
          </span>
          <span className="flex items-center gap-2">
            Powered by OpenStore
            <Link href={`/admin/${shop.slug}`} className="underline">
              Admin
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
