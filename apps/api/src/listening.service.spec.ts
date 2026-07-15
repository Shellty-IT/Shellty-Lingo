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

    const result = await service.attempt("user-1", "en-cafe-polite-request", {
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
});
