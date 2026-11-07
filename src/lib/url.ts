import { headers } from "next/headers";

export function getBaseUrl(): string {
  const configured = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (configured) return configured.replace(/\/+$/, "");

  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return "http://localhost:3000";
  const forwardedProto = headerList.get("x-forwarded-proto");
  const proto =
    forwardedProto ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export function absoluteUrl(path: string): string {
  return `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
