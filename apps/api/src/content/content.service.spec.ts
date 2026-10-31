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
      type: "single_choice" as const,
      prompt: "Choose the request.",
      level: "A1",
      contentFingerprint: "a".repeat(64),
      answer: { correct: "a" },
      options: [{ id: "a", text: "Could I have the menu?" }],
    },
  ],
  lesson: { module: { course: { level: "A1" } } },
};

describe("ContentService publication gate", () => {
  it.each(["missing", "blank", "complete"])(
    "requires full-sentence ordering translations: %s",
    async (kind) => {
      const exercise = {
        ...revision.exercises[0]!,
        type: "ordering",
        options: [
          { id: "a", text: "We work" },
          { id: "b", text: "here." },
        ],
        answer: { correct: ["a", "b"] },
      };
      const prisma = {
        translation: {
          findMany: vi.fn(({ where }: { where: { field: string } }) =>
            Promise.resolve(
              ["pl", "en", "th"]
                .filter(
                  (locale) =>
                    where.field !== "answerTranslation" ||
                    kind !== "missing" ||
                    locale !== "pl",
                )
                .map((locale) => ({
                  entityId: exercise.id,
                  locale,
                  value:
                    where.field === "answerTranslation" &&
                    kind === "blank" &&
                    locale === "pl"
                      ? "   "
                      : "Translated content",
                })),
            ),
          ),
        },
      };
      const service = new ContentService(
        prisma as never,
        {} as never,
        {} as never,
      );
      const ensureComplete = (
        service as unknown as { ensureComplete(input: unknown): Promise<void> }
      ).ensureComplete.bind(service);
      const result = ensureComplete({ ...revision, exercises: [exercise] });
      if (kind === "complete") await expect(result).resolves.toBeUndefined();
      else await expect(result).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.translation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            field: "answerTranslation",
            verifiedAt: { not: null },
          }) as unknown,
        }),
      );
    },
  );

  it.each(["missing", "generic", "one-option-only", "complete"])(
    "checks choice explanation completeness in all locales: %s",
    async (kind) => {
      const options = [
        { id: "a", text: "If I had known, I would have prepared." },
        { id: "b", text: "If I would know, I had prepared." },
      ];
      const exercise = {
        ...revision.exercises[0]!,
        type: "multiple_choice",
        options,
        answer: { correct: ["a"] },
      };
      const full = options
        .map(
          (option) =>
            `${option.text}\nExplanation of the relevant grammatical construction.`,
        )
        .join("\n\n");
      const prisma = {
        translation: {
          findMany: vi.fn(({ where }: { where: { field: string } }) =>
            Promise.resolve(
              where.field === "explanation"
                ? ["pl", "en", "th"]
                    .filter((locale) => kind !== "missing" || locale !== "th")
                    .map((locale) => ({
                      entityId: exercise.id,
                      locale,
                      value:
                        locale !== "pl" || kind === "complete"
                          ? full
                          : kind === "one-option-only"
                            ? options[0]!.text
                            : "Both are natural.",
                    }))
                : ["pl", "en", "th"].map((locale) => ({
                    entityId: exercise.id,
                    locale,
                    value: "Translated content",
                  })),
            ),
          ),
        },
      };
      const service = new ContentService(
        prisma as never,
        {} as never,
        {} as never,
      );
      const ensureComplete = (
        service as unknown as { ensureComplete(input: unknown): Promise<void> }
      ).ensureComplete.bind(service);
      if (kind === "complete")
        await expect(
          ensureComplete({ ...revision, exercises: [exercise] }),
        ).resolves.toBeUndefined();
      else
        await expect(
          ensureComplete({ ...revision, exercises: [exercise] }),
        ).rejects.toMatchObject({
          response: {
            code: "CONTENT_INCOMPLETE",
            details: expect.arrayContaining([
              expect.stringContaining(
                "verified explanations covering every option missing",
              ),
            ]) as unknown,
          },
        });
      expect(prisma.translation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            field: "explanation",
            verifiedAt: { not: null },
          }) as unknown,
        }),
      );
    },
  );

  it("does not expose answer keys or explanations in the learner lesson payload", async () => {
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
                level: "A1",
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
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({ currentLevel: "A1" }),
      },
    };
    const service = new ContentService(
      prisma as never,
      {} as never,
      {} as never,
    );

    const lesson = await service.publishedLesson(
      "user-1",
      "english-a1",
      "polite-requests",
    );

    expect(lesson.exercises[0]).not.toHaveProperty("answer");
    expect(lesson.exercises[0]).not.toHaveProperty("explanation");
  });

  it("does not expose an A1 task catalogue to an A2 learner", async () => {
    const prisma = {
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          slug: "polite-requests",
          module: {
            slug: "restaurant-basics",
            course: { slug: "english-a1", language: "en", level: "A1" },
          },
          publishedRevision: {
            status: "published",
            exercises: [{ id: "exercise-1", level: "A1" }],
          },
        }),
      },
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({ currentLevel: "A2" }),
      },
    };
    const service = new ContentService(
      prisma as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.publishedLesson("user-1", "english-a1", "polite-requests"),
    ).rejects.toMatchObject({
      response: { code: "PUBLISHED_LESSON_NOT_FOUND" },
    });
  });

  it("does not create a revision without a valid exercise contract", async () => {
    const service = new ContentService({} as never, {} as never, {} as never);
    await expect(
      service.createRevision("editor", revision.lessonId, {
        title: "Incomplete lesson",
        estimatedMinutes: 5,
        exercises: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects task content that is already owned by another level", async () => {
    const transaction = vi.fn();
    const prisma = {
      lesson: {
        findUnique: vi.fn().mockResolvedValue({
          module: { course: { language: "en", level: "A1" } },
        }),
      },
      exerciseIdentity: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ fingerprint: "f".repeat(64), level: "A2" }]),
      },
      $transaction: transaction,
    };
    const service = new ContentService(
      prisma as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.createRevision("editor", revision.lessonId, {
        title: revision.title,
        estimatedMinutes: revision.estimatedMinutes,
        exercises: revision.exercises,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a matching task whose answer references a missing option", async () => {
    const service = new ContentService({} as never, {} as never, {} as never);

    await expect(
      service.createRevision("editor", revision.lessonId, {
        title: "Broken matching task",
        estimatedMinutes: 5,
        exercises: [
          {
            id: "matching-1",
            type: "matching",
            prompt: "Match the words.",
            options: [
              { id: "coffee", text: "coffee" },
              { id: "kawa", text: "kawa" },
            ],
            answer: { pairs: { coffee: "missing-translation" } },
          },
        ],
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
    const service = new ContentService(
      prisma as never,
      {} as never,
      {} as never,
    );

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
      {} as never,
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

  it("requires an independent reviewer for approval", async () => {
    const prisma = {
      contentRevision: {
        findUnique: vi.fn().mockResolvedValue({
          ...revision,
          status: "review",
        }),
      },
      contentAuditEntry: {
        findFirst: vi.fn().mockResolvedValue({ actorId: "author" }),
      },
    };
    const service = new ContentService(
      prisma as never,
      { log: vi.fn() } as never,
      {} as never,
    );

    await expect(
      service.review("author", revision.id, true),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("stores a prompt translation against an exercise in the revision", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "translation" });
    const prisma = {
      contentRevision: { findUnique: vi.fn().mockResolvedValue(revision) },
      translation: { upsert },
      contentAuditEntry: { create: vi.fn() },
    };
    const service = new ContentService(
      prisma as never,
      { log: vi.fn() } as never,
      {} as never,
    );

    await service.upsertTranslation("editor", revision.id, {
      exerciseId: revision.exercises[0]!.id,
      locale: "pl",
      field: "prompt",
      value: "Wybierz prośbę.",
      verified: true,
    });

    const upsertInput = upsert.mock.calls[0]?.[0] as
      | {
          create: { entityType: string; entityId: string; field: string };
        }
      | undefined;
    expect(upsertInput?.create).toMatchObject({
      entityType: "exercise",
      entityId: revision.exercises[0]!.id,
      field: "prompt",
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
    const service = new ContentService(
      prisma as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.submitForReview("editor", revision.id),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
