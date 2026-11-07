import Link from "next/link";
import { Logo } from "@/components/logo";
import { Icon, type IconName } from "@/components/icons";
import { PLAN_SEEDS, planFeatures } from "@/lib/plans";
import { formatMoney } from "@/lib/money";

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "products",
    title: "Catalog that scales",
    body: "Products, multi-option variants, SKUs, compare-at pricing, cost, weight, images, inventory and automated collections."
  },
  {
    icon: "orders",
    title: "Orders end to end",
    body: "Checkout creates real orders with payments, tax, discounts and shipping. Fulfill, refund, cancel and print packing slips."
  },
  {
    icon: "store",
    title: "Themeable storefront",
    body: "Every store gets its own themed storefront with hero, collections, product pages, search, blog, cart and checkout."
  },
  {
    icon: "billing",
    title: "Plans, trials & billing",
    body: "Five tiers with trial periods, invoices, usage limits for products and staff, and plan-aware transaction pricing."
  },
  {
    icon: "apps",
    title: "Apps that extend the UI",
    body: "Install apps that change storefront behavior — reviews, newsletter capture, chat and inventory integrations."
  },
  {
    icon: "globe",
    title: "API & webhooks",
    body: "Scoped API tokens for products, orders and shop data plus signed webhook delivery with a full delivery log."
  }
];

const CHECKLIST = [
  "Multi-tenant shops with path-based storefronts",
  "Owner and staff roles with plan-enforced seats",
  "Guest checkout with shipping and tax calc",
  "Percentage, fixed and free-shipping discounts",
  "Automated collections by type, vendor, tag or price",
  "Order timeline, tracking and partial refunds",
  "Customer profiles, addresses and spend history",
  "Theme editor with presets and live preview",
  "Blog, pages and storefront search",
  "Signed webhooks with HMAC and retries log",
  "REST API tokens with product and order scopes",
  "Freeze store when subscription is cancelled"
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <Link href="/s/demo" className="hover:text-slate-900">
              Demo store
            </Link>
            <Link href="/admin/demo" className="hover:text-slate-900">
              Demo admin
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary">
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.28),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.16),transparent_35%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <Icon name="sparkle" className="h-3.5 w-3.5" />
              Reverse Engineering Analysis → working platform
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              The open-source Shopify,
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                reconstructed from the outside in.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              open-shopify reimplements the observable behavior of a modern commerce platform:
              multi-tenant admin, storefront, checkout, themes, apps, discounts, payments,
              webhooks, API and plan-based billing — in one TypeScript codebase.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup" className="btn btn-primary px-5 py-2.5 text-[15px]">
                Create your store
                <Icon name="external" className="h-4 w-4" />
              </Link>
              <Link
                href="/s/demo"
                className="btn border border-white/20 bg-white/5 px-5 py-2.5 text-[15px] text-white hover:bg-white/10"
              >
                Explore the demo store
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Demo owner <span className="font-mono text-slate-300">owner@demo.com</span> /{" "}
              <span className="font-mono text-slate-300">demo1234</span>
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-emerald-950/40 backdrop-blur">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-3 rounded bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
                  open-shopify / admin / demo
                </span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[168px_1fr] sm:p-5">
                <div className="hidden space-y-1 rounded-xl bg-slate-950/60 p-3 sm:block">
                  {[
                    ["Home", true],
                    ["Orders", false],
                    ["Products", false],
                    ["Collections", false],
                    ["Customers", false],
                    ["Discounts", false],
                    ["Analytics", false],
                    ["Plan & billing", false]
                  ].map(([label, active]) => (
                    <div
                      key={String(label)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] ${
                        active ? "bg-emerald-500/15 text-emerald-300" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Net sales", "$12,480"],
                      ["Orders", "128"],
                      ["Conversion", "3.4%"],
                      ["Avg. order", "$97.50"]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-32 items-end gap-1.5">
                      {[35, 48, 42, 58, 51, 66, 62, 74, 69, 82, 77, 90, 85, 96].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Feature parity</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            The parts of commerce that actually matter
          </h2>
          <p className="mt-3 text-slate-600">
            Reverse-engineered from public product behavior, then rebuilt as a coherent,
            database-backed application — not a UI mockup.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card card-pad transition-shadow hover:shadow-soft">
              <div className="mb-3 inline-flex rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                <Icon name={feature.icon} className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                “All things plans” is included
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Starter, Basic, Shopify, Advanced and Plus tiers are first-class data, not marketing
                copy. Plans gate product counts and staff seats, drive transaction-fee metadata,
                generate invoices and support trials, upgrades, cancellations and store freezing.
              </p>
              <Link href="#pricing" className="admin-link mt-4 inline-flex items-center gap-1">
                See the plan matrix <Icon name="arrow-left" className="h-4 w-4 rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2.5 text-slate-700 shadow-sm">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="text-xs leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Plans & billing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Simple plans, fully enforced in code
            </h2>
            <p className="mt-3 text-slate-600">
              Every plan starts with a 14-day free trial. Prices mirror the reverse-engineered
              public plan ladder; transaction fees describe third-party payment providers.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {PLAN_SEEDS.map((plan) => {
              const featured = plan.code === "shopify";
              return (
                <div
                  key={plan.code}
                  className={`relative flex flex-col rounded-2xl border p-5 ${
                    featured
                      ? "border-emerald-600 bg-white shadow-lg shadow-emerald-600/10 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {featured ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-semibold text-white">
                      Most popular
                    </span>
                  ) : null}
                  <h3 className="text-sm font-semibold text-slate-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight text-slate-900">
                      {formatMoney(plan.priceMonthly)}
                    </span>
                    <span className="text-xs text-slate-500">/mo</span>
                  </div>
                  <p className="mt-1.5 min-h-[48px] text-xs leading-relaxed text-slate-500">{plan.description}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {planFeatures({ features: plan.features.join("\n") }).map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <Icon name="check" className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/signup?plan=${plan.code}`}
                    className={`btn mt-5 w-full ${featured ? "btn-primary" : "btn-outline"}`}
                  >
                    Start free trial
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Online card rates vary by plan (2.9% + 30¢ → 2.15% + 30¢). Third-party transaction fees
            range from 5% to 0.15%. Taxes and local legal requirements are out of scope for this study.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-3 sm:p-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Kick the tires in 30 seconds</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The seeded demo store includes 12 products, 11 orders across every status, 8 customers,
              4 discounts, 3 themes, reviews, blog posts, invoices, an API token and webhook
              configuration. Log in as the owner or staff to see role isolation.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Storefront", "/s/demo", "Browse, add to cart, check out"],
                ["Admin", "/admin/demo", "owner@demo.com / demo1234"],
                ["Staff", "/admin/demo", "staff@demo.com / demo1234"]
              ].map(([label, href, hint]) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-medium text-emerald-700">{href}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 p-5 text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Why build this?</p>
            <p className="mt-2 text-sm leading-relaxed">
              A reverse engineering analysis (REA) of Shopify&apos;s observable product surfaces —
              admin IA, checkout, pricing ladder, API and theme model — turned into an executable
              specification and an independent implementation.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Docs live in <span className="font-mono text-slate-400">docs/REA.md</span> and{" "}
              <span className="font-mono text-slate-400">README.md</span>.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs">A reverse-engineering educational project. Not affiliated with Shopify Inc.</span>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <Link href="/s/demo" className="hover:text-slate-900">
              Demo store
            </Link>
            <Link href="/login" className="hover:text-slate-900">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-slate-900">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
