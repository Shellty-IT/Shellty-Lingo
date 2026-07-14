import { describe, expect, it } from "vitest";

import { parseApiEnvironment } from "./index";

describe("parseApiEnvironment", () => {
  it("parses a complete local environment", () => {
    const env = parseApiEnvironment({
      DATABASE_URL:
        "postgresql://shellty:password@localhost:5432/shellty_lingo",
    });
    expect(env.APP_ENV).toBe("development");
    expect(env.API_PORT).toBe(3001);
    expect(env.CORS_ORIGINS).toContain("http://localhost:3002");
  });

  it("reports invalid fields without leaking values", () => {
    expect(() => parseApiEnvironment({ DATABASE_URL: "secret" })).toThrow(
      "Invalid API environment variables: DATABASE_URL",
    );
  });
});
