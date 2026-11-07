import Link from "next/link";
import { Icon } from "./icons";

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  FULFILLED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  UNFULFILLED: "bg-amber-50 text-amber-700 border border-amber-200",
  AUTHORIZED: "bg-blue-50 text-blue-700 border border-blue-200",
  DRAFT: "bg-slate-100 text-slate-600 border border-slate-200",
  ARCHIVED: "bg-slate-100 text-slate-600 border border-slate-200",
  DISABLED: "bg-slate-100 text-slate-600 border border-slate-200",
  UNPUBLISHED: "bg-slate-100 text-slate-600 border border-slate-200",
  PARTIALLY_REFUNDED: "bg-orange-50 text-orange-700 border border-orange-200",
  REFUNDED: "bg-slate-100 text-slate-600 border border-slate-200",
  VOIDED: "bg-red-50 text-red-700 border border-red-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
  OPEN: "bg-amber-50 text-amber-700 border border-amber-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  SENT: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  OUTBOX: "bg-blue-50 text-blue-700 border border-blue-200",
  QUEUED: "bg-amber-50 text-amber-700 border border-amber-200",
  FAILED: "bg-red-50 text-red-700 border border-red-200"
};

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border border-slate-200";
  const label = status.replaceAll("_", " ").toLowerCase();
  return (
    <span className={`badge ${style} ${className}`}>
      <span className="capitalize">{label}</span>
    </span>
  );
}

export function Banner({
  kind = "error",
  children
}: {
  kind?: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  if (!children) return null;
  const styles =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : kind === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-blue-200 bg-blue-50 text-blue-800";
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  icon
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {icon ? <div className="rounded-lg bg-slate-100 p-2 text-slate-500">{icon}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon name="products" className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SettingsTabs({ slug, active }: { slug: string; active: string }) {
  const tabs = [
    { key: "general", label: "General" },
    { key: "checkout", label: "Checkout" },
    { key: "integrations", label: "Integrations" },
    { key: "notifications", label: "Notifications" },
    { key: "users", label: "Users & permissions" },
    { key: "api", label: "API keys" },
    { key: "webhooks", label: "Webhooks" }
  ];
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/admin/${slug}/settings/${tab.key}`}
          className={`-mb-px rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
            active === tab.key
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export function RevenueChart({
  data,
  currency
}: {
  data: { label: string; value: number; display: string }[];
  currency?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex h-48 items-end gap-1.5">
        {data.map((point, index) => {
          const height = Math.max(3, Math.round((point.value / max) * 100));
          return (
            <div key={`${point.label}-${index}`} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-emerald-500/80 transition-colors group-hover:bg-emerald-600"
                style={{ height: `${height}%` }}
              />
              <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white group-hover:block">
                {point.display}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-slate-400">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          style={n <= Math.round(rating) ? { fill: "#fbbf24" } : undefined}
        />
      ))}
    </span>
  );
}
