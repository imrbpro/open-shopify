import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public", "images");
mkdirSync(outDir, { recursive: true });

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">${body}</svg>\n`;
}

const products = [
  {
    file: "product-1.svg",
    a: "#e7e0d3",
    b: "#cbbfa6",
    accent: "#8a7a5c",
    shape: `<path d="M300 250 L360 210 Q400 250 440 210 L500 250 L560 330 L500 370 L500 600 L300 600 L300 370 L240 330 Z" fill="#f6f1e6" stroke="#8a7a5c" stroke-width="6"/>
      <path d="M355 215 Q400 275 445 215" stroke="#8a7a5c" stroke-width="6" fill="none"/>`
  },
  {
    file: "product-2.svg",
    a: "#dfe5e8",
    b: "#b6c3c9",
    accent: "#5b6b73",
    shape: `<path d="M300 270 L340 230 Q370 300 400 300 Q430 300 460 230 L500 270 L560 350 L505 395 L505 610 L295 610 L295 395 L240 350 Z" fill="#eef2f4" stroke="#5b6b73" stroke-width="6"/>
      <path d="M345 245 Q400 350 455 245" stroke="#5b6b73" stroke-width="6" fill="none"/>
      <path d="M340 520 L460 520" stroke="#5b6b73" stroke-width="6"/>`
  },
  {
    file: "product-3.svg",
    a: "#f1e4d3",
    b: "#dcc3a4",
    accent: "#92693f",
    shape: `<path d="M270 300 L530 300 L555 640 L245 640 Z" fill="#f7efe2" stroke="#92693f" stroke-width="6"/>
      <path d="M340 300 Q340 210 400 210 Q460 210 460 300" stroke="#92693f" stroke-width="8" fill="none"/>
      <path d="M320 380 L480 380" stroke="#c0a072" stroke-width="4" stroke-dasharray="10 12"/>`
  },
  {
    file: "product-4.svg",
    a: "#e5e7df",
    b: "#c8cbbe",
    accent: "#6f7464",
    shape: `<rect x="300" y="300" width="200" height="260" rx="24" fill="#f4f4ee" stroke="#6f7464" stroke-width="6"/>
      <path d="M500 360 Q580 360 580 440 Q580 520 500 520" stroke="#6f7464" stroke-width="8" fill="none"/>
      <path d="M300 360 L500 360" stroke="#6f7464" stroke-width="6"/>
      <ellipse cx="400" cy="300" rx="100" ry="22" fill="#d9dacf" stroke="#6f7464" stroke-width="6"/>`
  },
  {
    file: "product-5.svg",
    a: "#e4dfd7",
    b: "#c9c0b2",
    accent: "#7a6a55",
    shape: `<rect x="290" y="230" width="220" height="340" rx="12" fill="#f7f3ea" stroke="#7a6a55" stroke-width="6"/>
      <path d="M330 230 L330 570" stroke="#c2ab8d" stroke-width="10"/>
      <rect x="365" y="300" width="110" height="8" rx="4" fill="#bfb3a0"/>
      <rect x="365" y="330" width="80" height="8" rx="4" fill="#d3c9b9"/>`
  },
  {
    file: "product-6.svg",
    a: "#e9e2ea",
    b: "#cfc2d3",
    accent: "#7c5a86",
    shape: `<circle cx="400" cy="420" r="150" fill="#f5eff6" stroke="#7c5a86" stroke-width="8"/>
      <circle cx="400" cy="420" r="105" fill="#e7d9ea" stroke="#7c5a86" stroke-width="4"/>
      <path d="M400 300 L420 380 L505 380 L437 428 L463 510 L400 462 L337 510 L363 428 L295 380 L380 380 Z" fill="#c49bd0" opacity=".8"/>`
  },
  {
    file: "product-7.svg",
    a: "#e3d6c8",
    b: "#c6ae94",
    accent: "#734f2e",
    shape: `<rect x="260" y="320" width="280" height="200" rx="22" fill="#8a5c33" stroke="#5c3a1c" stroke-width="6"/>
      <path d="M260 360 L540 360" stroke="#5c3a1c" stroke-width="4"/>
      <rect x="370" y="395" width="60" height="36" rx="8" fill="#d9b45c" stroke="#5c3a1c" stroke-width="4"/>
      <path d="M300 320 Q300 270 360 270 L440 270 Q500 270 500 320" stroke="#5c3a1c" stroke-width="6" fill="none"/>`
  },
  {
    file: "product-8.svg",
    a: "#e2e4e8",
    b: "#c4c9d1",
    accent: "#5f6672",
    shape: `<path d="M280 470 Q280 280 400 280 Q520 280 520 470 L520 570 L280 570 Z" fill="#eef0f3" stroke="#5f6672" stroke-width="6"/>
      <path d="M280 470 Q400 500 520 470" stroke="#5f6672" stroke-width="6" fill="none"/>
      <path d="M330 340 Q400 300 470 340" stroke="#a4abb6" stroke-width="10" fill="none"/>`
  },
  {
    file: "product-9.svg",
    a: "#e6e2d5",
    b: "#c9c2ad",
    accent: "#6c6345",
    shape: `<path d="M400 220 L470 370 L330 370 Z" fill="#f0ebdc" stroke="#6c6345" stroke-width="6"/>
      <rect x="385" y="370" width="30" height="150" fill="#6c6345"/>
      <path d="M280 560 Q400 500 520 560" stroke="#6c6345" stroke-width="8" fill="none"/>
      <circle cx="400" cy="300" r="14" fill="#d7c98b"/>`
  },
  {
    file: "product-10.svg",
    a: "#eadfd5",
    b: "#d3bdab",
    accent: "#8a6349",
    shape: `<rect x="250" y="330" width="300" height="240" rx="18" fill="#f3e9dd" stroke="#8a6349" stroke-width="6"/>
      <path d="M250 410 L550 410 M250 490 L550 490" stroke="#c4a888" stroke-width="4"/>
      <path d="M250 330 Q400 360 550 330" stroke="#8a6349" stroke-width="6" fill="none"/>`
  },
  {
    file: "product-11.svg",
    a: "#dfe8e6",
    b: "#bfd1cd",
    accent: "#43706a",
    shape: `<rect x="340" y="250" width="120" height="340" rx="40" fill="#eef5f3" stroke="#43706a" stroke-width="6"/>
      <rect x="370" y="200" width="60" height="60" rx="12" fill="#43706a"/>
      <path d="M370 320 L430 320" stroke="#43706a" stroke-width="6"/>
      <path d="M370 470 L430 470" stroke="#9cbcb5" stroke-width="6"/>`
  },
  {
    file: "product-12.svg",
    a: "#ece3d6",
    b: "#d8c6ac",
    accent: "#8f6a3d",
    shape: `<rect x="320" y="310" width="160" height="250" rx="16" fill="#f6eee1" stroke="#8f6a3d" stroke-width="6"/>
      <ellipse cx="400" cy="310" rx="80" ry="18" fill="#e8d8bf" stroke="#8f6a3d" stroke-width="6"/>
      <path d="M400 310 Q400 250 430 220" stroke="#8f6a3d" stroke-width="5" fill="none"/>
      <path d="M430 220 Q455 235 440 260 Q415 255 430 220 Z" fill="#d4a24c"/>`
  }
];

for (const p of products) {
  const body = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".35" r=".6">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".7"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="640" cy="180" r="260" fill="url(#glow)"/>
  <circle cx="160" cy="660" r="220" fill="${p.accent}" opacity=".08"/>
  ${p.shape}`;
  writeFileSync(join(outDir, p.file), svg(800, 800, body));
}

const heroes = [
  {
    file: "hero-dawn.svg",
    bg1: "#d6ece6",
    bg2: "#f6f1e4",
    accent: "#0f766e",
    shapes: `<circle cx="1240" cy="240" r="300" fill="#0f766e" opacity=".12"/>
      <circle cx="1080" cy="560" r="190" fill="#14b8a6" opacity=".16"/>
      <rect x="920" y="300" width="280" height="360" rx="24" fill="#ffffff" opacity=".5"/>
      <circle cx="1060" cy="480" r="110" fill="#0f766e" opacity=".25"/>`
  },
  {
    file: "hero-spotlight.svg",
    bg1: "#121218",
    bg2: "#2a0e18",
    accent: "#e11d48",
    shapes: `<circle cx="1220" cy="300" r="340" fill="#e11d48" opacity=".22"/>
      <circle cx="1000" cy="520" r="200" fill="#fb7185" opacity=".14"/>
      <path d="M900 700 L1180 220 L1460 700 Z" fill="#fecdd3" opacity=".08"/>
      <rect x="1180" y="360" width="220" height="300" rx="16" fill="#e11d48" opacity=".2"/>`
  },
  {
    file: "hero-organic.svg",
    bg1: "#f2eddc",
    bg2: "#e2ebd2",
    accent: "#4d7c0f",
    shapes: `<circle cx="1250" cy="300" r="330" fill="#4d7c0f" opacity=".14"/>
      <circle cx="1040" cy="560" r="180" fill="#84cc16" opacity=".2"/>
      <path d="M980 680 Q1080 380 1260 260" stroke="#4d7c0f" stroke-width="10" opacity=".35" fill="none"/>
      <path d="M1100 500 Q1180 470 1210 530 Q1130 560 1100 500 Z" fill="#65a30d" opacity=".4"/>
      <path d="M1150 420 Q1240 400 1270 460 Q1180 480 1150 420 Z" fill="#65a30d" opacity=".3"/>`
  }
];

for (const h of heroes) {
  const body = `
  <defs>
    <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${h.bg1}"/><stop offset="1" stop-color="${h.bg2}"/>
    </linearGradient>
    <radialGradient id="hglow" cx=".7" cy=".3" r=".6">
      <stop offset="0" stop-color="${h.accent}" stop-opacity=".25"/><stop offset="1" stop-color="${h.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#hbg)"/>
  <rect width="1600" height="900" fill="url(#hglow)"/>
  ${h.shapes}`;
  writeFileSync(join(outDir, h.file), svg(1600, 900, body));
}

const placeholder = svg(
  800,
  800,
  `<rect width="800" height="800" fill="#f1f2f4"/>
   <circle cx="400" cy="360" r="110" fill="#d8dbe0"/>
   <rect x="330" y="300" width="140" height="140" rx="16" fill="#c3c8cf"/>
   <text x="400" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#8b929c">No image</text>`
);
writeFileSync(join(outDir, "placeholder.svg"), placeholder);

console.log(`Generated ${products.length} product images, ${heroes.length} heroes, 1 placeholder in ${outDir}`);
