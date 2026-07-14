import { describe, expect, it } from "vitest";

import { colors, minimumTouchTarget } from "./index";

describe("design tokens", () => {
  it("preserves the accepted source design palette", () => {
    expect(colors.backgroundInverse).toBe("#0B1A30");
    expect(colors.actionPrimary).toBe("#1F6FEB");
    expect(colors.actionSupport).toBe("#0D8F85");
  });

  it("keeps platform touch targets accessible", () => {
    expect(minimumTouchTarget.ios).toBeGreaterThanOrEqual(44);
    expect(minimumTouchTarget.android).toBeGreaterThanOrEqual(48);
  });
});
