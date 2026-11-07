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
          <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="m4 8.5 8 4.5 8-4.5M12 13v7" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      <span className={`${text} font-semibold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        Open<span className="text-emerald-600">Store</span>
      </span>
    </span>
  );
}
