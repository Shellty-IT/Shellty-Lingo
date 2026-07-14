import { describe, expect, it } from "vitest";

import { locales, translations } from "./index";

describe("foundation translations", () => {
  it("keeps identical keys in PL, EN and TH", () => {
    const baseline = Object.keys(translations.pl).sort();
    for (const locale of locales) {
      expect(Object.keys(translations[locale]).sort()).toEqual(baseline);
      expect(Object.values(translations[locale]).every(Boolean)).toBe(true);
    }
  });
});
