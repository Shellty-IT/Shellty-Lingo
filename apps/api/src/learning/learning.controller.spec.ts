import { GUARDS_METADATA } from "@nestjs/common/constants";
import { ThrottlerGuard } from "@nestjs/throttler";
import { describe, expect, it, vi } from "vitest";

import { LearningController } from "./learning.controller";

describe("LearningController exercise tutor", () => {
  it("delegates the authenticated learner and draft to the lesson service", async () => {
    const lessons = {
      exerciseHint: vi.fn().mockResolvedValue({
        exerciseId: "exercise-1",
        hint: "Sprawdź szyk pytania.",
        focus: "word_order",
        dynamic: true,
      }),
    };
    const controller = new LearningController(
      {} as never,
      {} as never,
      lessons as never,
      {} as never,
      {} as never,
    );

    await expect(
      controller.exerciseHint(
        "session-1",
        "exercise-1",
        { learnerDraft: "Where you" },
        { sub: "user-1", role: "learner" },
      ),
    ).resolves.toMatchObject({ focus: "word_order" });
    expect(lessons.exerciseHint).toHaveBeenCalledWith(
      "user-1",
      "session-1",
      "exercise-1",
      "Where you",
    );
  });

  it("applies request throttling to the hint endpoint", () => {
    const handler = Object.getOwnPropertyDescriptor(
      LearningController.prototype,
      "exerciseHint",
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];

    expect(guards).toContain(ThrottlerGuard);
  });
});
