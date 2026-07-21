import { ConflictException, Injectable } from "@nestjs/common";
import type {
  ReviewQueueItem,
  ReviewRating,
  ReviewResult,
} from "@shellty/api-contracts";

import { PrismaService } from "../core/prisma.service";
import { SRS_ALGORITHM_VERSION, scheduleReview } from "./learning-engine";
import {
  LearningContext,
  invalid,
  notFound,
  parseIdempotencyKey,
  parseLanguage,
  toReviewQueueItem,
} from "./learning-support";

const reviewRatings = new Set<ReviewRating>(["again", "hard", "good", "easy"]);

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: LearningContext,
  ) {}

  async reviews(
    userId: string,
    languageValue?: string,
  ): Promise<ReviewQueueItem[]> {
    const language = parseLanguage(languageValue);
    const userCourse = await this.context.userCourse(userId, language);
    const items = await this.prisma.reviewItem.findMany({
      where: { userCourseId: userCourse.id, dueAt: { lte: new Date() } },
      orderBy: { dueAt: "asc" },
      take: 50,
    });
    return items.map((item) => toReviewQueueItem(item));
  }

  async review(
    userId: string,
    itemId: string,
    input: { rating?: string; idempotencyKey?: string },
  ): Promise<ReviewResult> {
    if (!reviewRatings.has(input.rating as ReviewRating))
      throw invalid("INVALID_REVIEW_RATING", "Invalid review rating.");
    const rating = input.rating as ReviewRating;
    const idempotencyKey = parseIdempotencyKey(input.idempotencyKey);
    const item = await this.prisma.reviewItem.findUnique({
      where: { id: itemId },
      include: { userCourse: true },
    });
    if (!item || item.userCourse.userId !== userId)
      throw notFound("REVIEW_ITEM_NOT_FOUND", "Review not found.");
    const previous = await this.prisma.reviewAttempt.findUnique({
      where: {
        reviewItemId_idempotencyKey: { reviewItemId: itemId, idempotencyKey },
      },
    });
    if (previous)
      return {
        itemId,
        rating: previous.rating,
        dueAt: previous.nextDueAt.toISOString(),
        intervalMinutes: previous.intervalMinutes,
        alreadyRecorded: true,
      };
    const now = new Date();
    if (item.algorithmVersion !== SRS_ALGORITHM_VERSION)
      throw new ConflictException({
        code: "UNSUPPORTED_REVIEW_ALGORITHM",
        message: "This review item requires migration before it can be rated.",
      });
    const next = scheduleReview(item, rating, now);
    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.reviewItem.updateMany({
        where: {
          id: itemId,
          dueAt: item.dueAt,
          algorithmVersion: SRS_ALGORITHM_VERSION,
        },
        data: {
          intervalMinutes: next.intervalMinutes,
          easeFactor: next.easeFactor,
          repetitions: next.repetitions,
          lapses: next.lapses,
          dueAt: next.dueAt,
          lastReviewedAt: now,
          lastResult: rating,
          algorithmVersion: SRS_ALGORITHM_VERSION,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException({
          code: "REVIEW_ALREADY_UPDATED",
          message: "This review was already updated. Refresh the queue.",
        });
      await transaction.reviewAttempt.create({
        data: {
          reviewItemId: itemId,
          idempotencyKey,
          rating,
          previousDueAt: item.dueAt,
          nextDueAt: next.dueAt,
          intervalMinutes: next.intervalMinutes,
          algorithmVersion: SRS_ALGORITHM_VERSION,
        },
      });
    });
    await this.context.event(
      userId,
      item.userCourseId,
      null,
      "review_completed",
      {
        itemId,
        rating,
        intervalMinutes: next.intervalMinutes,
      },
    );
    return {
      itemId,
      rating,
      dueAt: next.dueAt.toISOString(),
      intervalMinutes: next.intervalMinutes,
      alreadyRecorded: false,
    };
  }
}
