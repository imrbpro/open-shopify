import Script from "next/script";
import type { ShopSettings } from "@/lib/settings-defaults";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function StoreAnalytics({ settings }: { settings: ShopSettings }) {
  if (settings.analyticsProvider === "ga4" && settings.gaMeasurementId) {
    const id = settings.gaMeasurementId;
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
        <Script id="openstore-ga4" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(id)});`}
        </Script>
      </>
    );
  }

  if (settings.analyticsProvider === "gtm" && settings.gtmContainerId) {
    const id = settings.gtmContainerId;
    return (
      <>
        <Script id="openstore-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(id)});`}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      </>
    );
  }

  if (settings.analyticsProvider === "plausible" && settings.plausibleDomain) {
    return (
      <Script
        defer
        data-domain={settings.plausibleDomain}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
    );
  }

  if (settings.analyticsProvider === "custom" && isHttpUrl(settings.customAnalyticsScriptUrl)) {
    return <Script src={settings.customAnalyticsScriptUrl} strategy="afterInteractive" />;
  }

  return null;
}
