import { describe, expect, it } from "vitest";
import {
  gradeListeningChallenge,
  listeningChallenges,
} from "./listening-engine";

describe("listening lab", () => {
  it("does not expose the answer key in a challenge", () => {
    const [challenge] = listeningChallenges("en", "A2", "pl", () => 0.5);
    expect(challenge).toBeDefined();
    expect(challenge).not.toHaveProperty("correctOptionId");
  });

  it("returns only the requested level and four shuffled options", () => {
    const challenges = listeningChallenges("en", "A2", "pl", () => 0.25);
    expect(challenges.length).toBeGreaterThanOrEqual(8);
    expect(challenges.every((challenge) => challenge.level === "A2")).toBe(
      true,
    );
    expect(
      challenges.every((challenge) => challenge.options.length === 4),
    ).toBe(true);
    const firstAnswersCorrect = challenges.filter(
      (challenge) =>
        gradeListeningChallenge(challenge.id, challenge.options[0]!.id)
          ?.correct,
    );
    expect(firstAnswersCorrect.length).toBeGreaterThan(0);
    expect(firstAnswersCorrect.length).toBeLessThan(challenges.length);
  });

  it("localizes challenge copy independently of the recorded language", () => {
    const polish = listeningChallenges("en", "A2", "pl", () => 0);
    const english = listeningChallenges("en", "A2", "en", () => 0);
    expect(polish.map((challenge) => challenge.id)).toEqual(
      english.map((challenge) => challenge.id),
    );
    expect(polish[0]?.instruction).not.toBe(english[0]?.instruction);
    expect(polish[0]?.audio.text).toBe(english[0]?.audio.text);
  });

  it("grades a valid attempt and reveals the transcript afterwards", () => {
    expect(
      gradeListeningChallenge("en-a1-cafe-order", "a", "pl"),
    ).toMatchObject({
      correct: true,
      transcript: "Could I have a cup of tea, please?",
    });
  });

  it("rejects an option outside the challenge", () => {
    expect(gradeListeningChallenge("en-a1-cafe-order", "unknown")).toBeNull();
  });
});
