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
      type: "single_choice",
      prompt: "Choose the request.",
      answer: { correct: "a" },
      options: [{ id: "a", text: "Could I have the menu?" }],
    },
  ],
};

describe("ContentService publication gate", () => {
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
});
