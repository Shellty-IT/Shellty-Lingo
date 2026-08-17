import { describe, expect, it, vi } from "vitest";

import { ListeningService } from "./listening.service";

describe("ListeningService attempt idempotency", () => {
  it("stores a correct completion under the supplied idempotency key", async () => {
    const prisma = {
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({ id: "course-1" }),
      },
      learningEvent: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const service = new ListeningService(
      prisma as never,
      {
        requireAvailable: vi.fn().mockResolvedValue(undefined),
      } as never,
    );

    const result = await service.attempt("user-1", "en-a1-cafe-order", {
      optionId: "a",
      idempotencyKey: "listen:attempt:1",
    });

    expect(result.correct).toBe(true);
    const createInput = prisma.learningEvent.create.mock.calls[0]?.[0] as
      | undefined
      | {
          data: {
            idempotencyKey: string;
            name: string;
            userCourseId: string;
          };
        };
    expect(createInput?.data).toMatchObject({
      idempotencyKey: "listen:attempt:1",
      name: "listening_completed",
      userCourseId: "course-1",
    });
  });

  it("serves only the learner's level and prioritizes unseen challenges", async () => {
    const prisma = {
      userCourse: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: "course-1", currentLevel: "A2" }),
      },
      learningEvent: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { properties: { challengeId: "en-a2-station-platform" } },
          ]),
      },
    };
    const service = new ListeningService(
      prisma as never,
      {
        requireAvailable: vi.fn().mockResolvedValue(undefined),
      } as never,
    );

    const result = await service.catalog("user-1", "en", "pl");

    expect(result.length).toBeGreaterThanOrEqual(8);
    expect(result.every((challenge) => challenge.level === "A2")).toBe(true);
    expect(result.at(-1)?.id).toBe("en-a2-station-platform");
    expect(result.every((challenge) => challenge.options.length === 4)).toBe(
      true,
    );
  });
});
