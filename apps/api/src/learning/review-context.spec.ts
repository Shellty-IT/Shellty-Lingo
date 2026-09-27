import { describe, expect, it, vi } from "vitest";
import { ReviewService } from "./review.service";

describe("review presentation preserves the learning task", () => {
  it("reconstructs a fragment correction as a gap and uses a reviewed localized goal", async () => {
    const prisma = {
      reviewItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "review",
            sourceKey: "exercise:task",
            sourceText: "Arrange a meeting",
            dueAt: new Date(),
            repetitions: 0,
          },
        ]),
      },
      exercise: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "task",
            type: "gap_fill",
            answer: { accepted: ["meet"] },
            options: null,
            explanation: null,
            learningObjective: "Arrange a meeting",
            interaction: {
              kind: "correct_fragment",
              before: "We ",
              fragment: "meets",
              after: " at four.",
            },
          },
        ]),
      },
      vocabularyEntry: { findMany: vi.fn().mockResolvedValue([]) },
      translation: {
        findMany: vi.fn().mockResolvedValue([
          {
            entityType: "exercise",
            entityId: "task",
            field: "learningObjective",
            value: "Umów spotkanie",
          },
        ]),
      },
    };
    const context = {
      userCourse: vi
        .fn()
        .mockResolvedValue({ id: "course", currentLevel: "A2" }),
    };
    const [item] = await new ReviewService(
      prisma as never,
      context as never,
    ).reviews("user", "en", "pl");
    expect(item).toMatchObject({
      sourceText: "We ___ at four.",
      learningObjective: "Umów spotkanie",
      answerLanguage: "en",
      normalizationPolicy: "gap-v2",
      answer: { expectedAnswer: "meet" },
    });
    expect(prisma.translation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          verifiedAt: { not: null },
        }) as unknown,
      }),
    );
  });
});
