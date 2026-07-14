import { describe, expect, it } from "vitest";
import {
  gradeListeningChallenge,
  listeningChallenges,
} from "./listening-engine";

describe("listening lab", () => {
  it("does not expose the answer key in a challenge", () => {
    const [challenge] = listeningChallenges("en");
    expect(challenge).toBeDefined();
    expect(challenge).not.toHaveProperty("correctOptionId");
  });

  it("grades a valid attempt and reveals the transcript afterwards", () => {
    expect(
      gradeListeningChallenge("en-cafe-polite-request", "a"),
    ).toMatchObject({
      correct: true,
      transcript: "Could I have a cup of tea, please?",
      nextChallengeId: "en-station-platform",
    });
  });

  it("rejects an option outside the challenge", () => {
    expect(
      gradeListeningChallenge("en-cafe-polite-request", "unknown"),
    ).toBeNull();
  });
});
