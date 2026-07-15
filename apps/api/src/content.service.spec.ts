import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { ContentService } from "./content.service";

const revision = {
  id: "c02b2e59-0e21-4ff2-813d-539b768b5029",
  lessonId: "d6d58e12-a432-4e2a-b318-73918cd36874",
  version: 1,
  status: "draft",
  title: "First requests",
  estimatedMinutes: 5,
  exercises: [
    {
      id: "25ba1468-982e-42ce-beaf-3deae2d8f4c0",
      type: "single_choice",
      prompt: "Choose the request.",
      answer: { correct: "a" },
      options: [{ id: "a", text: "Could I have the menu?" }],
    },
  ],
};

describe("ContentService publication gate", () => {
  it("does not expose answer keys in the learner lesson payload", async () => {
    const prisma = {
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          slug: "polite-requests",
          module: {
            slug: "restaurant-basics",
            title: "At a restaurant",
            position: 1,
            course: { slug: "english-a1", language: "en", level: "A1" },
          },
          publishedRevision: {
            status: "published",
            title: "Polite requests",
            summary: null,
            estimatedMinutes: 5,
            version: 1,
            exercises: [
              {
                id: "exercise-1",
                type: "single_choice",
                prompt: "Choose one.",
                options: [{ id: "a", text: "Please." }],
                answer: { correct: "a" },
                explanation: "This is polite.",
                mediaAssetId: null,
              },
            ],
          },
        }),
      },
    };
    const service = new ContentService(prisma as never, {} as never);

    const lesson = await service.publishedLesson(
      "english-a1",
      "polite-requests",
    );

    expect(lesson.exercises[0]).not.toHaveProperty("answer");
  });

  it("does not create a revision without a valid exercise contract", async () => {
    const service = new ContentService({} as never, {} as never);
    await expect(
      service.createRevision("editor", revision.lessonId, {
        title: "Incomplete lesson",
        estimatedMinutes: 5,
        exercises: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects review submission when a verified UI translation is missing", async () => {
    const prisma = {
      contentRevision: {
        findUnique: vi.fn().mockResolvedValue(revision),
      },
      translation: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ locale: "pl" }, { locale: "en" }]),
      },
    };
    const service = new ContentService(prisma as never, {} as never);

    await expect(
      service.submitForReview("editor", revision.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("does not let a rejected review retain an approval", async () => {
    const update = vi.fn().mockResolvedValue({
      ...revision,
      status: "draft",
      reviewedAt: null,
      reviewedById: null,
    });
    const prisma = {
      contentRevision: {
        findUnique: vi.fn().mockResolvedValue({
          ...revision,
          status: "review",
        }),
        update,
      },
      contentAuditEntry: { create: vi.fn() },
    };
    const service = new ContentService(
      prisma as never,
      { log: vi.fn() } as never,
    );

    await service.review("editor", revision.id, false, "Needs changes");

    const updateInput = update.mock.calls[0]?.[0] as
      | undefined
      | {
          data: {
            status: string;
            reviewedAt: null;
            reviewedById: null;
          };
        };
    expect(updateInput?.data).toMatchObject({
      status: "draft",
      reviewedAt: null,
      reviewedById: null,
    });
  });

  it("rejects direct submission of an already published revision", async () => {
    const prisma = {
      contentRevision: {
        findUnique: vi.fn().mockResolvedValue({
          ...revision,
          status: "published",
        }),
      },
    };
    const service = new ContentService(prisma as never, {} as never);

    await expect(
      service.submitForReview("editor", revision.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
