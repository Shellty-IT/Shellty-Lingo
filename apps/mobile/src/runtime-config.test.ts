import { describe, expect, it } from "vitest";

import { resolveApiUrl } from "./runtime-config";

describe("resolveApiUrl", () => {
  it("uses the configured URL and removes trailing slashes", () => {
    expect(resolveApiUrl(" https://example.com/v1/// ", false)).toBe(
      "https://example.com/v1",
    );
  });

  it("never falls back to localhost in a production bundle", () => {
    expect(resolveApiUrl(undefined, false)).toBe(
      "https://shellty-lingo-api.onrender.com/v1",
    );
  });

  it("keeps localhost available for local development", () => {
    expect(resolveApiUrl(undefined, true)).toBe("http://localhost:3001/v1");
  });
});
