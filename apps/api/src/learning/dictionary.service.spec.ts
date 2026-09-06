import { describe, expect, it, vi } from "vitest";

import { DictionaryService } from "./dictionary.service";

describe("DictionaryService level isolation", () => {
  it("does not expose dictionary context from another learning level", async () => {
    const prisma = {
      exercise: {
        findUnique: vi.fn().mockResolvedValue({
          id: "exercise-a1",
          level: "A1",
          prompt: "Choose the answer.",
          options: [{ id: "a", text: "answer" }],
          revision: {
            status: "published",
            lesson: {
              module: { course: { language: "en", level: "A1" } },
            },
          },
        }),
      },
      vocabularyEntry: { findFirst: vi.fn() },
    };
    const context = {
      userCourse: vi.fn().mockResolvedValue({
        id: "user-course-1",
        currentLevel: "A2",
      }),
    };
    const service = new DictionaryService(
      prisma as never,
      context as never,
      null,
    );

    await expect(
      service.dictionary("user-1", {
        exerciseId: "exercise-a1",
        selection: "answer",
        targetLocale: "pl",
      }),
    ).rejects.toMatchObject({
      response: { code: "DICTIONARY_CONTEXT_NOT_FOUND" },
    });
    expect(prisma.vocabularyEntry.findFirst).not.toHaveBeenCalled();
  });
});
