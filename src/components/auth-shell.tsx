import Link from "next/link";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";

export function AuthShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.25),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.18),transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/">
            <Logo light />
          </Link>
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
              Everything you need to run a store, open and self-hosted.
            </h2>
            <ul className="mt-8 space-y-4 text-sm text-slate-300">
              {[
                "Products, variants, inventory and collections",
                "Orders, fulfillment, refunds and customer history",
                "Six themes, built-in apps, discounts and a public API",
                "Payments, email and analytics through your own providers"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-full bg-emerald-500/15 p-1 text-emerald-400">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">
            OpenStore · independent open-source commerce, built to self-host
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Demo:</span> owner@demo.com ·{" "}
            <span className="font-mono">demo1234</span> · store{" "}
            <Link href="/s/demo" className="font-medium text-emerald-700 hover:underline">
              /s/demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
