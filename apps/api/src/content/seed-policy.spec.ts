import { describe, expect, it } from "vitest";

import {
  assertDemoSeedEnvironment,
  vocabularySeedUpdate,
} from "../../prisma/seed-policy";

describe("demo content seed policy", () => {
  it.each(["production", "staging", undefined])(
    "rejects unreviewed publication in %s",
    (environment) => {
      expect(() => assertDemoSeedEnvironment(environment)).toThrow(
        "Release content requires editorial review",
      );
    },
  );

  it.each(["development", "test"])("allows demo data in %s", (environment) => {
    expect(() => assertDemoSeedEnvironment(environment)).not.toThrow();
  });

  it("preserves pronunciation metadata when another lesson reuses a word", () => {
    expect(vocabularySeedUpdate({ definition: "water" })).toEqual({
      definition: "water",
    });
    expect(
      vocabularySeedUpdate({
        definition: "water",
        transliteration: "náam",
        toneMarks: "high",
      }),
    ).toEqual({
      definition: "water",
      transliteration: "náam",
      toneMarks: "high",
    });
  });
});
