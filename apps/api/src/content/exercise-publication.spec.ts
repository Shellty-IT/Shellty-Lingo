import { describe, expect, it, vi } from "vitest";
import { ContentService } from "./content.service";
const locales = ["pl", "en", "th"];
const revision = {
  id: "revision",
  title: "Lesson",
  estimatedMinutes: 1,
  version: 1,
  status: "draft",
  lesson: { module: { course: { level: "A1" } } },
  exercises: [
    {
      id: "exercise",
      contentFingerprint: "a".repeat(64),
      level: "A1",
      type: "listening",
      prompt: "Hello",
      instructions: "Listen, then choose one answer.",
      options: [{ id: "a", text: "Hello" }],
      answer: { correct: "a" },
      mediaAssetId: "audio",
    },
  ],
};
const fixture = (missing?: string, invalidAudio = false) => {
  const prisma = {
    contentRevision: {
      findUnique: vi.fn().mockResolvedValue(revision),
      update: vi.fn().mockResolvedValue({ ...revision, status: "review" }),
    },
    contentAuditEntry: { create: vi.fn() },
    translation: {
      findMany: vi.fn((input: { where: { field: string } }) =>
        Promise.resolve(
          locales
            .filter(
              (locale) =>
                input.where.field !== "instructions" || locale !== missing,
            )
            .map((locale) => ({
              locale,
              entityId: "exercise",
              value: "Reviewed instruction",
            })),
        ),
      ),
    },
    mediaAsset: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "audio",
          kind: "audio",
          contentType: invalidAudio ? "text/html" : "audio/mpeg",
          byteSize: 100,
        },
      ]),
    },
  };
  return {
    prisma,
    service: new ContentService(
      prisma as never,
      { log: vi.fn() } as never,
      {} as never,
    ),
  };
};
describe("instruction and recording publication requirements", () => {
  it.each(locales)(
    "requires a verified %s instruction before review",
    async (missing) => {
      const f = fixture(missing);
      await expect(
        f.service.submitForReview("editor", "revision"),
      ).rejects.toMatchObject({
        response: {
          code: "CONTENT_INCOMPLETE",
          details: expect.arrayContaining([
            `exercise 1: verified instruction translations missing: ${missing}`,
          ]) as unknown,
        },
      });
      expect(f.prisma.contentRevision.update).not.toHaveBeenCalled();
      expect(f.prisma.translation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            field: "instructions",
            verifiedAt: { not: null },
          }) as unknown,
        }),
      );
    },
  );
  it("accepts complete instructions and an audio recording", async () => {
    const f = fixture();
    await expect(
      f.service.submitForReview("editor", "revision"),
    ).resolves.toMatchObject({ status: "review" });
  });
  it("rejects a media reference that cannot be played as audio", async () => {
    const f = fixture(undefined, true);
    await expect(
      f.service.submitForReview("editor", "revision"),
    ).rejects.toMatchObject({
      response: {
        code: "CONTENT_INCOMPLETE",
        details: expect.arrayContaining([
          "listening audio asset missing or invalid",
        ]) as unknown,
      },
    });
  });
});
