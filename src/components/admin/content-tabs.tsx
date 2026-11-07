import Link from "next/link";

export function ContentTabs({ slug, active }: { slug: string; active: "pages" | "blog" }) {
  const tabs = [
    { key: "pages", label: "Pages", href: `/admin/${slug}/content/pages` },
    { key: "blog", label: "Blog posts", href: `/admin/${slug}/content/blog` }
  ] as const;
  return (
    <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            active === tab.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
