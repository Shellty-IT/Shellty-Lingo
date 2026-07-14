import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const js = readFileSync(join(here, "app.js"), "utf8");
const html = readFileSync(join(here, "index.html"), "utf8");
const css = readFileSync(join(here, "styles.css"), "utf8");

const marker = "  const copy = ";
const start = js.indexOf(marker) + marker.length;
const end = js.indexOf("\n\n  const params", start);
if (start < marker.length || end < 0) throw new Error("Nie znaleziono słownika copy");
const copy = vm.runInNewContext(`(${js.slice(start, end).replace(/;\s*$/, "")})`);
const usedKeys = new Set([...js.matchAll(/\bt\(\"([^\"]+)\"\)/g)].map((match) => match[1]));

for (const locale of ["pl", "en", "th"]) {
  if (!copy[locale]) throw new Error(`Brak lokalizacji ${locale}`);
  const missing = [...usedKeys].filter((key) => !(key in copy[locale]));
  if (missing.length) throw new Error(`${locale}: brak kluczy: ${missing.join(", ")}`);
}

const requiredRoutes = ["welcome", "ui", "course", "goal", "time", "test", "today", "learn", "lesson", "result", "tutor", "tutor-setup", "chat", "progress", "profile"];
for (const route of requiredRoutes) {
  if (!js.includes(`\"${route}\"`) && !js.includes(`${route}:`)) throw new Error(`Brak trasy ${route}`);
}

for (const state of ["loading", "empty", "offline", "error", "limit", "session"]) {
  if (!js.includes(`\"${state}\"`)) throw new Error(`Brak stanu ${state}`);
}

for (const token of ["#0b1a30", "#1f6feb", "#12b5a8", "#e76f3e", "#f3f7fc"]) {
  if (!css.toLowerCase().includes(token)) throw new Error(`Brak tokenu źródłowego designu ${token}`);
}

for (const asset of ["./styles.css", "./app.js"]) {
  if (!html.includes(asset)) throw new Error(`Brak zasobu ${asset}`);
}

if (!css.includes("prefers-reduced-motion")) throw new Error("Brak obsługi reduced motion");
if (!css.includes(".text-200")) throw new Error("Brak wariantu 200% tekstu");
if (!js.includes('role=\"dialog\"') || !js.includes('aria-modal=\"true\"')) throw new Error("Brak dostępnego panelu słownika");

console.log(`OK: ${requiredRoutes.length} widoków, ${usedKeys.size} używanych kluczy × 3 języki, 6 stanów, tokeny designu i warianty a11y.`);
