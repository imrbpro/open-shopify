import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      },
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#0f9d76",
          600: "#0b8464",
          700: "#086b52",
          800: "#075744",
          900: "#064637"
        },
        ink: "#111827"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.18)"
      }
    }
  },
  plugins: []
};

export default config;
