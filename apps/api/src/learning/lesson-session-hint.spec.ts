import { describe, expect, it, vi } from "vitest";
import { ExerciseTutorUnavailableError } from "../ai/ai-exercise-tutor";

import {
  hintRevealsReferenceAnswer,
  LessonSessionService,
} from "./lesson-session.service";

const activeSession = {
  id: "session-1",
  kind: "lesson",
  status: "active",
  currentExerciseId: "exercise-1",
  result: { interfaceLocale: "pl" },
  userCourse: { id: "user-course-1", userId: "user-1", currentLevel: "A2" },
  lesson: {
    module: {
      course: { id: "course-1", language: "en", level: "A2" },
    },
  },
  contentRevision: {
    exercises: [
      {
        id: "exercise-1",
        type: "gap_fill",
        level: "A2",
        prompt: "The report is ___ on Friday.",
        instructions: "Type the missing word.",
        answer: { accepted: ["due"] },
      },
    ],
  },
};

describe("lesson exercise tutor", () => {
  it("detects exact, misspelled and spelled-out reference answers", () => {
    expect(hintRevealsReferenceAnswer("Wpisz due.", ["due"])).toBe(true);
    expect(hintRevealsReferenceAnswer("To może być d-u-e.", ["due"])).toBe(
      true,
    );
    expect(
      hintRevealsReferenceAnswer("Rozważ słowo becaus.", ["because"]),
    ).toBe(true);
    expect(
      hintRevealsReferenceAnswer("Sprawdź, jakiej części mowy wymaga luka.", [
        "due",
      ]),
    ).toBe(false);
  });

  it("allows safe grammar hints that share common words with a full model sentence", () => {
    const references = [
      "Your presentation was well structured; next time, try to support your conclusion with more data.",
      "Your presentation had a clear structure; next time, try to support the conclusion with more evidence.",
    ];
    expect(
      hintRevealsReferenceAnswer(
        "Najpierw pochwal jedną cechę, a następnie wskaż konkretny obszar do poprawy.",
        references,
      ),
    ).toBe(false);
    expect(
      hintRevealsReferenceAnswer(
        "Use a past tense for the praise and an infinitive to describe the suggestion.",
        references,
      ),
    ).toBe(false);
    expect(hintRevealsReferenceAnswer(references[0]!, references)).toBe(true);
  });

  it("returns a Groq-first tutor hint and records only safe metadata", async () => {
    const prisma = {
      learningSession: { findUnique: vi.fn().mockResolvedValue(activeSession) },
      exerciseTutorHint: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "hint-1" }),
        update: vi.fn().mockResolvedValue({ id: "hint-1" }),
        deleteMany: vi.fn(),
      },
    };
    const learningContext = { event: vi.fn() };
    const billing = { assertAiMessageAllowed: vi.fn() };
    const tutor = {
      hint: vi.fn().mockResolvedValue({
        result: {
          hint: "Pomyśl o słowie opisującym ustalony termin wykonania.",
          focus: "vocabulary",
          inputTokens: 100,
          outputTokens: 20,
        },
        servedBy: "groq",
      }),
    };
    const service = new LessonSessionService(
      prisma as never,
      learningContext as never,
      billing as never,
      {} as never,
      null,
      null,
      tutor as never,
    );

    await expect(
      service.exerciseHint("user-1", "session-1", "exercise-1", "du"),
    ).resolves.toEqual({
      exerciseId: "exercise-1",
      hint: "Pomyśl o słowie opisującym ustalony termin wykonania.",
      focus: "vocabulary",
      dynamic: true,
    });
    expect(tutor.hint).toHaveBeenCalledWith(
      expect.objectContaining({
        learnerDraft: "du",
        referenceAnswers: ["due"],
        interfaceLocale: "pl",
      }),
    );
    expect(billing.assertAiMessageAllowed).toHaveBeenCalledWith("user-1", true);
    const updateInput = prisma.exerciseTutorHint.update.mock.calls[0]?.[0] as
      | {
          data: {
            status: string;
            provider: string;
            inputTokens: number;
            outputTokens: number;
          };
        }
      | undefined;
    expect(updateInput?.data).toMatchObject({
      status: "ready",
      provider: "groq",
      inputTokens: 100,
      outputTokens: 20,
    });
    expect(learningContext.event).toHaveBeenCalledWith(
      "user-1",
      "user-course-1",
      "course-1",
      "exercise_hint_requested",
      expect.objectContaining({ servedBy: "groq" }),
    );
  });

  it("uses a safe fallback when the generated hint reveals the reference answer", async () => {
    const prisma = {
      learningSession: { findUnique: vi.fn().mockResolvedValue(activeSession) },
      exerciseTutorHint: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "hint-1" }),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
    };
    const tutor = {
      hint: vi.fn().mockResolvedValue({
        result: {
          hint: "Wpisz due.",
          focus: "vocabulary",
          inputTokens: 100,
          outputTokens: 5,
        },
        servedBy: "groq",
      }),
    };
    const service = new LessonSessionService(
      prisma as never,
      { event: vi.fn() } as never,
      { assertAiMessageAllowed: vi.fn() } as never,
      {} as never,
      null,
      null,
      tutor as never,
    );

    await expect(
      service.exerciseHint("user-1", "session-1", "exercise-1"),
    ).resolves.toMatchObject({
      exerciseId: "exercise-1",
      focus: "grammar",
      dynamic: false,
    });
    expect(prisma.exerciseTutorHint.update).toHaveBeenCalledWith({
      where: {
        sessionId_exerciseId: {
          sessionId: "session-1",
          exerciseId: "exercise-1",
        },
      },
      data: {
        status: "ready",
        hint: "Przeczytaj całe zdanie i sprawdź, jaka forma pasuje do luki.",
        focus: "grammar",
        provider: "local",
      },
    });
    expect(prisma.exerciseTutorHint.deleteMany).not.toHaveBeenCalled();
  });

  it("returns the persisted hint without spending quota or calling AI again", async () => {
    const prisma = {
      learningSession: { findUnique: vi.fn().mockResolvedValue(activeSession) },
      exerciseTutorHint: {
        findUnique: vi.fn().mockResolvedValue({
          status: "ready",
          hint: "Sprawdź, jakiego rodzaju słowa wymaga luka.",
          focus: "grammar",
        }),
      },
    };
    const billing = { assertAiMessageAllowed: vi.fn() };
    const tutor = { hint: vi.fn() };
    const service = new LessonSessionService(
      prisma as never,
      { event: vi.fn() } as never,
      billing as never,
      {} as never,
      null,
      null,
      tutor as never,
    );

    await expect(
      service.exerciseHint("user-1", "session-1", "exercise-1"),
    ).resolves.toEqual({
      exerciseId: "exercise-1",
      hint: "Sprawdź, jakiego rodzaju słowa wymaga luka.",
      focus: "grammar",
      dynamic: true,
    });
    expect(billing.assertAiMessageAllowed).not.toHaveBeenCalled();
    expect(tutor.hint).not.toHaveBeenCalled();
  });

  it("keeps a persisted local hint marked as a fallback", async () => {
    const prisma = {
      learningSession: { findUnique: vi.fn().mockResolvedValue(activeSession) },
      exerciseTutorHint: {
        findUnique: vi.fn().mockResolvedValue({
          status: "ready",
          hint: "Przeczytaj całe zdanie i sprawdź, jaka forma pasuje do luki.",
          focus: "grammar",
          provider: "local",
        }),
      },
    };
    const service = new LessonSessionService(
      prisma as never,
      { event: vi.fn() } as never,
      { assertAiMessageAllowed: vi.fn() } as never,
      {} as never,
      null,
      null,
      null,
    );

    await expect(
      service.exerciseHint("user-1", "session-1", "exercise-1"),
    ).resolves.toMatchObject({ dynamic: false, focus: "grammar" });
  });

  it("stores a safe local hint when tutor models fail", async () => {
    const prisma = {
      learningSession: { findUnique: vi.fn().mockResolvedValue(activeSession) },
      exerciseTutorHint: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "hint-1" }),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
    };
    const tutor = {
      hint: vi.fn().mockRejectedValue(
        new ExerciseTutorUnavailableError([
          {
            provider: "groq",
            model: "openai/gpt-oss-120b",
            reason: "rate_limit",
            status: 429,
          },
        ]),
      ),
    };
    const service = new LessonSessionService(
      prisma as never,
      { event: vi.fn() } as never,
      { assertAiMessageAllowed: vi.fn() } as never,
      {} as never,
      null,
      null,
      tutor as never,
    );
    await expect(
      service.exerciseHint("user-1", "session-1", "exercise-1"),
    ).resolves.toMatchObject({
      exerciseId: "exercise-1",
      focus: "grammar",
      dynamic: false,
    });
    expect(prisma.exerciseTutorHint.update).toHaveBeenCalledWith({
      where: {
        sessionId_exerciseId: {
          sessionId: "session-1",
          exerciseId: "exercise-1",
        },
      },
      data: {
        status: "ready",
        hint: "Przeczytaj całe zdanie i sprawdź, jaka forma pasuje do luki.",
        focus: "grammar",
        provider: "local",
      },
    });
    expect(prisma.exerciseTutorHint.deleteMany).not.toHaveBeenCalled();
  });
});
