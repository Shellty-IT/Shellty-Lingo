import { describe, expect, it, vi } from "vitest";
import { ReviewService } from "./review.service";
describe("bounded review batches", () => {
  it.each([5, 10])(
    "reports all due work beyond a %s-item batch",
    async (size) => {
      const prisma = { reviewItem: { count: vi.fn().mockResolvedValue(74) } };
      const context = {
        userCourse: vi
          .fn()
          .mockResolvedValue({ id: "course", currentLevel: "A2" }),
      };
      const service = new ReviewService(prisma as never, context as never);
      vi.spyOn(service, "reviews").mockResolvedValue(
        Array.from({ length: 50 }, (_, index) => ({
          id: String(index),
        })) as never,
      );
      const result = await service.batch("user", "th", "pl", size);
      expect(result.items).toHaveLength(size);
      expect(result).toMatchObject({
        size,
        totalDue: 74,
        remainingDue: 74 - size,
      });
      expect(prisma.reviewItem.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userCourseId: "course",
            level: "A2",
          }) as unknown,
        }),
      );
    },
  );
  it("rejects an unsupported size before reading learner data", async () => {
    await expect(
      new ReviewService({} as never, {} as never).batch("user", "en", "pl", 50),
    ).rejects.toMatchObject({ response: { code: "INVALID_BATCH_SIZE" } });
  });
});
