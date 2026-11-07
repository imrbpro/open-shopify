export function Logo({
  size = "md",
  light = false
}: {
  size?: "sm" | "md" | "lg";
  light?: boolean;
}) {
  const box = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`${box} inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M6.5 8.5 12 4l5.5 4.5v9a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5v-9Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M9.5 15.5c.8-1.6 1.7-2.4 2.5-2.4s1.7.8 2.5 2.4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      <span className={`${text} font-semibold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        open<span className="text-emerald-600">shopify</span>
      </span>
    </span>
  );
}
