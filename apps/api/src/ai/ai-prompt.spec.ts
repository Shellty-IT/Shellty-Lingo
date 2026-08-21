import { describe, expect, it } from "vitest";

import type { AiTurnRequest } from "./ai-provider";
import { conversationSystemPrompt } from "./ai-prompt";

const request: AiTurnRequest = {
  language: "en",
  level: "B1",
  scenarioId: "it-incident-b1",
  scenarioTitle: "Production incident",
  scenarioGoal: "Communicate impact and mitigation.",
  scenarioBriefing:
    "Release 4.7.2 affected 18% of EU customers. The rollback started at 09:32.",
  learnerRole: "You are the service owner.",
  objectives: ["State the impact.", "Explain mitigation."],
  role: "incident commander",
  correctionMode: "important_only",
  learnerText: "EU checkout is affected.",
  recentMessages: [],
};

describe("conversation prompt", () => {
  it("grounds the tutor in the briefing and prevents questionnaire behaviour", () => {
    const prompt = conversationSystemPrompt(request);

    expect(prompt).toContain(request.scenarioBriefing);
    expect(prompt).toContain("Respond directly to the meaning");
    expect(prompt).toContain("Ask at most one question");
    expect(prompt).toContain("Do not repeat a question");
    expect(prompt).not.toContain("end with a question");
  });
});
