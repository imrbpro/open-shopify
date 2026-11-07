import Link from "next/link";
import { Logo } from "@/components/logo";
import { Icon, type IconName } from "@/components/icons";

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "products",
    title: "Catalog that scales",
    body: "Products, multi-option variants, SKUs, compare-at pricing, cost, weight, images, inventory and automated collections."
  },
  {
    icon: "orders",
    title: "Orders end to end",
    body: "Checkout creates real orders with tax, discounts and shipping. Fulfill, refund, cancel and print packing slips."
  },
  {
    icon: "store",
    title: "Six original themes",
    body: "Classic, Noir, Meadow, Mono, Coastal and Ember. Each ships with its own palette, typography, copy and artwork."
  },
  {
    icon: "credit",
    title: "Bring your own payments",
    body: "Start with simulated checkout, switch to manual bank transfer, connect Stripe Checkout, or plug in a custom provider with signed webhooks."
  },
  {
    icon: "apps",
    title: "Useful built-in apps",
    body: "Product reviews, email marketing, wishlist and recently viewed are included with every store — no marketplace account required."
  },
  {
    icon: "globe",
    title: "API & webhooks",
    body: "Scoped API tokens for products, orders and shop data plus signed webhook delivery with a full delivery log."
  }
];

const CHECKLIST = [
  "Multi-tenant shops with path-based storefronts",
  "Owner and staff roles",
  "Guest checkout with shipping and tax calc",
  "Percentage, fixed and free-shipping discounts",
  "Automated collections by type, vendor, tag or price",
  "Order timeline, tracking and partial refunds",
  "Customer profiles, addresses and spend history",
  "Theme editor with presets and live preview",
  "Blog, pages and storefront search",
  "Signed webhooks with HMAC and a delivery log",
  "REST API tokens with product and order scopes",
  "Self-hosting with Docker and SQLite or Postgres"
];

const THEMES = [
  { name: "Classic", colors: ["#ffffff", "#f8fafc", "#0f766e", "#0f172a"], note: "Calm, editorial, built for everyday goods." },
  { name: "Noir", colors: ["#0b0b0f", "#16161d", "#e11d48", "#f5f5f7"], note: "High contrast for limited-run drops." },
  { name: "Meadow", colors: ["#fbfaf5", "#f3f1e8", "#4d7c0f", "#1c2a1f"], note: "Warm and natural for pantry and garden." },
  { name: "Mono", colors: ["#f7f7f5", "#ffffff", "#111111", "#525252"], note: "Swiss restraint for design-led brands." },
  { name: "Coastal", colors: ["#f4f9fb", "#e8f2f6", "#0e7490", "#0f2a33"], note: "Airy blues for travel and outdoor." },
  { name: "Ember", colors: ["#fffaf5", "#fdf0e6", "#c2410c", "#2b1a12"], note: "Rich warmth for food and craft." }
];

const INTEGRATIONS = [
  {
    icon: "credit" as IconName,
    title: "Payments",
    options: "Simulated · Manual · Stripe · Custom",
    body: "Every order is created as pending, then marked paid only when the provider confirms. Stripe Checkout and custom redirects share one signed return flow."
  },
  {
    icon: "sparkle" as IconName,
    title: "Email",
    options: "Outbox · Resend · Custom webhook",
    body: "Confirmation and shipping emails go through your provider with an inspectable delivery log. Start with the outbox and switch when you are ready."
  },
  {
    icon: "chart" as IconName,
    title: "Analytics",
    options: "GA4 · GTM · Plausible · Custom",
    body: "Drop in a traffic tag without touching the theme. Internal product, checkout and order events are always recorded in the admin."
  }
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
            <a href="#themes" className="hover:text-slate-900">
              Themes
            </a>
            <a href="#integrations" className="hover:text-slate-900">
              Integrations
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
              Create your store
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
              Open source · self-hosted · yours to own
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Commerce software
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                you can actually own.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              OpenStore is an independent commerce platform with a multi-tenant admin, six original
              themes, provider-agnostic payments and email, built-in marketing apps, a REST API and
              signed webhooks — in one TypeScript codebase.
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
                  openstore / admin / demo
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
                    ["Apps", false]
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Everything in one codebase
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            The parts of commerce that actually matter
          </h2>
          <p className="mt-3 text-slate-600">
            A database-backed application you can run, extend and deploy — not a mockup and not a
            per-seat subscription.
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
                No plans. No seats. No billing module.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                OpenStore does not ship a subscription engine, because it does not need one. Every
                feature is available to every store, and you decide how to host and support it.
              </p>
              <Link href="#integrations" className="admin-link mt-4 inline-flex items-center gap-1">
                See the integration model <Icon name="arrow-left" className="h-4 w-4 rotate-180" />
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

      <section id="themes" className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Themes</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Six starting points, zero lookalikes
            </h2>
            <p className="mt-3 text-slate-600">
              Each preset pairs its own palette, type, hero artwork and default copy. Duplicate any
              theme and make it yours in the editor.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((theme) => (
              <div key={theme.name} className="card overflow-hidden">
                <div className="grid h-24 grid-cols-4">
                  {theme.colors.map((color) => (
                    <div key={color} style={{ background: color }} />
                  ))}
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-slate-900">{theme.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{theme.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="integrations" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Integrations
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Your providers, your credentials
          </h2>
          <p className="mt-3 text-slate-600">
            Configure payments, email delivery and analytics from the admin. Keys stay in your own
            database and are never sent anywhere except the provider you choose.
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {INTEGRATIONS.map((integration) => (
            <div key={integration.title} className="card card-pad">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-lg bg-slate-900 p-2.5 text-white">
                  <Icon name={integration.icon} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{integration.title}</h3>
                  <p className="text-[11px] font-medium text-emerald-700">{integration.options}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{integration.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Apps</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Included, not upsold
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Reviews, email capture, wishlists and recently viewed are implemented as built-in
                storefront capabilities. Install or remove them per store from the admin, and edit
                the source when your store needs something different.
              </p>
              <Link href="/admin/demo/apps" className="admin-link mt-4 inline-flex items-center gap-1">
                Browse the demo apps <Icon name="arrow-left" className="h-4 w-4 rotate-180" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["heart", "Wishlist", "Save products in the browser and revisit them from a dedicated page."],
                ["star", "Product Reviews", "Star ratings, customer reviews and a review form on every product."],
                ["orders", "Email Marketing", "Newsletter signup capture in the storefront footer."],
                ["search", "Recently Viewed", "A browsing-history rail on product pages and the home page."]
              ].map(([icon, title, body]) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <Icon name={icon as IconName} className="h-4 w-4 text-emerald-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-3 sm:p-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Kick the tires in 30 seconds</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The seeded demo store includes 12 products, 11 orders across every status, 8 customers,
              4 discounts, 6 themes, 4 built-in apps, reviews, blog posts, an API token and webhook
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
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Why OpenStore?</p>
            <p className="mt-2 text-sm leading-relaxed">
              Commerce platforms should be inspectable, portable and affordable to operate. OpenStore
              is a complete reference implementation of the core merchant workflow, with clean
              extension points for the services only you can choose.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Self-hosting and architecture docs live in{" "}
              <span className="font-mono text-slate-400">docs/</span> and{" "}
              <span className="font-mono text-slate-400">README.md</span>.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="max-w-md text-xs">
              An independent open-source commerce platform. Not affiliated with Shopify Inc. or any
              other commerce provider.
            </span>
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
