export type ThemeFont = "sans" | "serif" | "mono";

export type ThemeConfig = {
  preset: string;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
  };
  fonts: { heading: ThemeFont; body: ThemeFont };
  hero: { heading: string; subheading: string; ctaLabel: string; image: string };
  announcement: { enabled: boolean; text: string };
  footer: { text: string };
  nav: { label: string; href: string }[];
};

export const FONT_STACKS: Record<ThemeFont, string> = {
  sans: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', serif",
  mono: "'SFMono-Regular', Menlo, Consolas, monospace"
};

export const DEFAULT_THEME: ThemeConfig = {
  preset: "classic",
  colors: {
    primary: "#0f766e",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0",
    accent: "#ccfbf1"
  },
  fonts: { heading: "sans", body: "sans" },
  hero: {
    heading: "Everyday goods, made to last.",
    subheading: "Thoughtfully designed essentials for home and away, built with materials that age well.",
    ctaLabel: "Shop all",
    image: "/images/hero-classic.svg"
  },
  announcement: { enabled: true, text: "Free shipping on orders over $75" },
  footer: { text: "Timeless essentials, responsibly made." },
  nav: [
    { label: "Shop", href: "/collections/all" },
    { label: "About", href: "/pages/about" },
    { label: "Journal", href: "/blog" }
  ]
};

export const THEME_PRESETS: Record<string, { name: string; config: ThemeConfig }> = {
  classic: { name: "Classic", config: DEFAULT_THEME },
  noir: {
    name: "Noir",
    config: {
      preset: "noir",
      colors: {
        primary: "#e11d48",
        background: "#0b0b0f",
        surface: "#16161d",
        text: "#f5f5f7",
        muted: "#a1a1aa",
        border: "#2a2a35",
        accent: "#fecdd3"
      },
      fonts: { heading: "serif", body: "sans" },
      hero: {
        heading: "After dark, dress sharp.",
        subheading: "Limited-run pieces for people who dress like they mean it. Small batches, no restocks.",
        ctaLabel: "Shop the drop",
        image: "/images/hero-noir.svg"
      },
      announcement: { enabled: true, text: "New drop live now — free express shipping over $150" },
      footer: { text: "Small batches. No restocks. No regrets." },
      nav: [
        { label: "Shop", href: "/collections/all" },
        { label: "Lookbook", href: "/collections/new-arrivals" },
        { label: "About", href: "/pages/about" }
      ]
    }
  },
  meadow: {
    name: "Meadow",
    config: {
      preset: "meadow",
      colors: {
        primary: "#4d7c0f",
        background: "#fbfaf5",
        surface: "#f3f1e8",
        text: "#1c2a1f",
        muted: "#6b7264",
        border: "#e3dfd1",
        accent: "#ecfccb"
      },
      fonts: { heading: "serif", body: "serif" },
      hero: {
        heading: "Grown close to home.",
        subheading: "Seasonal pantry and garden goods sourced from small farms within 100 miles.",
        ctaLabel: "Browse the harvest",
        image: "/images/hero-meadow.svg"
      },
      announcement: { enabled: true, text: "Free local delivery every Friday" },
      footer: { text: "Good things grow slowly." },
      nav: [
        { label: "Shop", href: "/collections/all" },
        { label: "Our farms", href: "/pages/about" },
        { label: "Journal", href: "/blog" }
      ]
    }
  },
  mono: {
    name: "Mono",
    config: {
      preset: "mono",
      colors: {
        primary: "#111111",
        background: "#f7f7f5",
        surface: "#efefec",
        text: "#111111",
        muted: "#6b6b6b",
        border: "#d9d9d4",
        accent: "#e4e4df"
      },
      fonts: { heading: "mono", body: "sans" },
      hero: {
        heading: "Less, but better.",
        subheading: "A tightly edited collection of useful objects. No noise, no filler, no seasonal churn.",
        ctaLabel: "View the edit",
        image: "/images/hero-mono.svg"
      },
      announcement: { enabled: false, text: "" },
      footer: { text: "Useful things, considered carefully." },
      nav: [
        { label: "Shop", href: "/collections/all" },
        { label: "About", href: "/pages/about" },
        { label: "Contact", href: "/pages/contact" }
      ]
    }
  },
  coastal: {
    name: "Coastal",
    config: {
      preset: "coastal",
      colors: {
        primary: "#0369a1",
        background: "#fbfcfc",
        surface: "#eef6f8",
        text: "#0c2733",
        muted: "#5b7480",
        border: "#d6e4e9",
        accent: "#d8f1f7"
      },
      fonts: { heading: "sans", body: "sans" },
      hero: {
        heading: "Salt air, slow days.",
        subheading: "Sun-faded layers, woven carryalls and small comforts for weekends near the water.",
        ctaLabel: "Shop the coast",
        image: "/images/hero-coastal.svg"
      },
      announcement: { enabled: true, text: "Free shipping on orders over $75" },
      footer: { text: "Made for the long way home." },
      nav: [
        { label: "Shop", href: "/collections/all" },
        { label: "New arrivals", href: "/collections/new-arrivals" },
        { label: "Journal", href: "/blog" }
      ]
    }
  },
  ember: {
    name: "Ember",
    config: {
      preset: "ember",
      colors: {
        primary: "#b45309",
        background: "#fffaf3",
        surface: "#f9efe2",
        text: "#2b1a0f",
        muted: "#7f6754",
        border: "#ebdcc8",
        accent: "#fde8c8"
      },
      fonts: { heading: "serif", body: "sans" },
      hero: {
        heading: "Made for long evenings.",
        subheading: "Warm ceramics, soft linen and honest pantry staples for the table you gather around.",
        ctaLabel: "Gather with us",
        image: "/images/hero-ember.svg"
      },
      announcement: { enabled: true, text: "Free shipping on orders over $75" },
      footer: { text: "Good company, good food, good light." },
      nav: [
        { label: "Shop", href: "/collections/all" },
        { label: "Our story", href: "/pages/about" },
        { label: "Journal", href: "/blog" }
      ]
    }
  }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseThemeConfig(json: string | null | undefined): ThemeConfig {
  const base: ThemeConfig = JSON.parse(JSON.stringify(DEFAULT_THEME));
  if (!json) return base;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return base;
  }
  if (!isRecord(parsed)) return base;
  const mergeInto = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    for (const key of Object.keys(source)) {
      const value = source[key];
      const current = target[key];
      if (isRecord(value) && isRecord(current)) {
        mergeInto(current, value);
      } else if (value !== undefined && value !== null) {
        target[key] = value;
      }
    }
  };
  mergeInto(base as unknown as Record<string, unknown>, parsed);
  if (!Array.isArray(base.nav) || base.nav.length === 0) base.nav = DEFAULT_THEME.nav;
  return base;
}

export function serializeThemeConfig(config: ThemeConfig): string {
  return JSON.stringify(config);
}

export function themeCssVars(config: ThemeConfig): Record<string, string> {
  return {
    "--os-primary": config.colors.primary,
    "--os-bg": config.colors.background,
    "--os-surface": config.colors.surface,
    "--os-text": config.colors.text,
    "--os-muted": config.colors.muted,
    "--os-border": config.colors.border,
    "--os-accent": config.colors.accent,
    "--os-font-heading": FONT_STACKS[config.fonts.heading] ?? FONT_STACKS.sans,
    "--os-font-body": FONT_STACKS[config.fonts.body] ?? FONT_STACKS.sans
  };
}
