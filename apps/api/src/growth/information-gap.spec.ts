import { describe, expect, it } from "vitest";
import {
  informationGapScenarios,
  publicScenario,
  informationGapReply,
} from "./information-gap";
describe("information gap pilot", () => {
  it.each(["en", "th"] as const)(
    "keeps %s partner facts out of the learner briefing and objectives",
    (language) => {
      const scenario = publicScenario(informationGapScenarios[language]);
      expect(scenario.briefing).toBe(scenario.learnerRole);
      expect(scenario.objectives.join(" ")).not.toContain(
        language === "en" ? "thirty minutes" : "สามสิบนาที",
      );
    },
  );
  it.each([
    ["en", "When are you available?", "Tuesday at four"],
    ["en", "How long should it last?", "thirty minutes"],
    ["th", "ว่างเมื่อไร", "อังคารตอนสี่โมง"],
    ["th", "ประชุมนานเท่าไร", "สามสิบนาที"],
  ] as const)(
    "answers the requested fact in %s",
    (language, text, expected) => {
      expect(informationGapReply(language, text)).toContain(expected);
    },
  );
});
