"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

type NavItem = { href: string; label: string; icon: IconName };
type NavSection = { section: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    section: "Overview",
    items: [
      { href: "", label: "Home", icon: "home" },
      { href: "/orders", label: "Orders", icon: "orders" },
      { href: "/products", label: "Products", icon: "products" },
      { href: "/collections", label: "Collections", icon: "collections" },
      { href: "/customers", label: "Customers", icon: "customers" },
      { href: "/discounts", label: "Discounts", icon: "discount" }
    ]
  },
  {
    section: "Sales channels",
    items: [
      { href: "/online-store/themes", label: "Online store", icon: "store" },
      { href: "/content/pages", label: "Content", icon: "page" },
      { href: "/apps", label: "Apps", icon: "apps" }
    ]
  },
  {
    section: "Insights",
    items: [{ href: "/analytics", label: "Analytics", icon: "chart" }]
  },
  {
    section: "Settings",
    items: [{ href: "/settings/general", label: "Settings", icon: "settings" }]
  }
];

function sectionsFor(role: string): NavSection[] {
  if (role === "OWNER") return SECTIONS;
  return SECTIONS.filter((section) => section.section !== "Settings");
}

function isActive(pathname: string, base: string, href: string): boolean {
  const target = `${base}${href}`;
  if (href === "") return pathname === base;
  if (href === "/settings/general") return pathname.startsWith(`${base}/settings`);
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function AdminNav({ slug, role }: { slug: string; role: string }) {
  const pathname = usePathname() ?? "";
  const base = `/admin/${slug}`;

  return (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sectionsFor(role).map((section) => (
          <div key={section.section}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {section.section}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, base, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={`${base}${item.href}`}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon name={item.icon} className="h-[18px] w-[18px]" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-5 py-3 text-[11px] text-slate-500">
        OpenStore v1.0
      </div>
    </nav>
  );
}

export function MobileAdminNav({ slug, role }: { slug: string; role: string }) {
  const pathname = usePathname() ?? "";
  const base = `/admin/${slug}`;
  const items = sectionsFor(role).flatMap((s) => s.items);
  return (
    <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
      {items.map((item) => {
        const active = isActive(pathname, base, item.href);
        return (
          <Link
            key={item.href}
            href={`${base}${item.href}`}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Icon name={item.icon} className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
