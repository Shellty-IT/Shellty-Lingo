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
  isRecord,
  notFound,
  parseIdempotencyKey,
  parseLanguage,
  parseLocale,
  toReviewQueueItem,
} from "./learning-support";

const reviewRatings = new Set<ReviewRating>(["again", "hard", "good", "easy"]);

type ReviewExercise = {
  id: string;
  type: string;
  options: unknown;
  answer: unknown;
  explanation: string | null;
};

type ReviewVocabulary = {
  id: string;
  term: string;
  partOfSpeech: string | null;
  definition: string;
};

const textOptions = (value: unknown): Array<{ id: string; text: string }> =>
  Array.isArray(value)
    ? value.flatMap((option) =>
        isRecord(option) &&
        typeof option["id"] === "string" &&
        typeof option["text"] === "string"
          ? [{ id: option["id"], text: option["text"] }]
          : [],
      )
    : [];

const answerTexts = (
  exercise: ReviewExercise,
  fallback: string | null,
  noAnswer: string,
): ReviewQueueItem["answer"] => {
  const answer = isRecord(exercise.answer) ? exercise.answer : {};
  const options = textOptions(exercise.options);
  const correct =
    typeof answer["correct"] === "string"
      ? [answer["correct"]]
      : Array.isArray(answer["correct"])
        ? answer["correct"].filter(
            (value): value is string => typeof value === "string",
          )
        : [];

  if (
    (exercise.type === "single_choice" || exercise.type === "listening") &&
    correct.length > 0 &&
    options.length > 0
  )
    return { mode: "single_choice", options, correctOptionIds: correct };

  if (
    exercise.type === "multiple_choice" &&
    correct.length > 0 &&
    options.length > 0
  )
    return { mode: "multiple_choice", options, correctOptionIds: correct };

  const accepted = Array.isArray(answer["accepted"])
    ? answer["accepted"].filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const optionText = new Map(options.map((option) => [option.id, option.text]));
  const ordered = correct.map((id) => optionText.get(id) ?? id).join(" ");
  const pairs = isRecord(answer["pairs"])
    ? Object.entries(answer["pairs"])
        .filter((pair): pair is [string, string] => typeof pair[1] === "string")
        .map(
          ([left, right]) =>
            `${optionText.get(left) ?? left} – ${optionText.get(right) ?? right}`,
        )
        .join("; ")
    : "";
  const values = accepted.length
    ? accepted
    : ordered
      ? [ordered]
      : pairs
        ? [pairs]
        : fallback
          ? [fallback]
          : [];
  return {
    mode: "text",
    acceptedAnswers: values,
    expectedAnswer: values[0] ?? noAnswer,
  };
};

const quotedExpression = (sourceText: string): string | undefined =>
  sourceText.match(/[„“"]([^”"]+)[”"]/u)?.[1]?.trim();

const reviewCopy = {
  pl: {
    noAnswer: "Brak zapisanej odpowiedzi",
    correct: (answer: string) => `Poprawna odpowiedź: ${answer}`,
    vocabularyExplanation: (term: string, definition: string) =>
      `„${term}” oznacza: ${definition}.`,
    vocabularyTip: (term: string, part: string) =>
      `Używaj „${term}” jako ${part}. Ułóż własne zdanie związane z sytuacją z lekcji.`,
    exerciseTip: (expression: string) =>
      `Używaj zwrotu „${expression}” jako całej, naturalnej wypowiedzi w sytuacji podobnej do tej z ćwiczenia.`,
    parts: {
      noun: "rzeczownika",
      verb: "czasownika",
      adjective: "przymiotnika",
      adverb: "przysłówka",
      phrase: "gotowego zwrotu",
      fallback: "słowa lub zwrotu",
    },
  },
  en: {
    noAnswer: "No saved answer",
    correct: (answer: string) => `Correct answer: ${answer}`,
    vocabularyExplanation: (term: string, definition: string) =>
      `“${term}” means: ${definition}.`,
    vocabularyTip: (term: string, part: string) =>
      `Use “${term}” as ${part}. Write your own sentence in a situation from the lesson.`,
    exerciseTip: (expression: string) =>
      `Use “${expression}” as a complete, natural response in a situation similar to the exercise.`,
    parts: {
      noun: "a noun",
      verb: "a verb",
      adjective: "an adjective",
      adverb: "an adverb",
      phrase: "a set phrase",
      fallback: "a word or phrase",
    },
  },
  th: {
    noAnswer: "ไม่มีคำตอบที่บันทึกไว้",
    correct: (answer: string) => `คำตอบที่ถูกต้อง: ${answer}`,
    vocabularyExplanation: (term: string, definition: string) =>
      `“${term}” หมายถึง ${definition}`,
    vocabularyTip: (term: string, part: string) =>
      `ใช้ “${term}” เป็น${part} แล้วแต่งประโยคของคุณเองจากสถานการณ์ในบทเรียน`,
    exerciseTip: (expression: string) =>
      `ใช้ “${expression}” เป็นข้อความที่สมบูรณ์และเป็นธรรมชาติในสถานการณ์ที่คล้ายกับแบบฝึกหัด`,
    parts: {
      noun: "คำนาม",
      verb: "คำกริยา",
      adjective: "คำคุณศัพท์",
      adverb: "คำวิเศษณ์",
      phrase: "วลีสำเร็จรูป",
      fallback: "คำหรือวลี",
    },
  },
} as const;

const localizedPartOfSpeech = (
  value: string | null,
  locale: keyof typeof reviewCopy,
): string => {
  const parts = reviewCopy[locale].parts as Record<string, string>;
  return (value ? parts[value.toLowerCase()] : undefined) ?? parts["fallback"]!;
};

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: LearningContext,
  ) {}

  async reviews(
    userId: string,
    languageValue?: string,
    localeValue?: string,
  ): Promise<ReviewQueueItem[]> {
    const language = parseLanguage(languageValue);
    const locale = parseLocale(localeValue);
    const copy = reviewCopy[locale];
    const userCourse = await this.context.userCourse(userId, language);
    const items = await this.prisma.reviewItem.findMany({
      where: { userCourseId: userCourse.id, dueAt: { lte: new Date() } },
      orderBy: { dueAt: "asc" },
      take: 50,
    });
    const exerciseIds = items.flatMap((item) =>
      item.sourceKey.startsWith("exercise:")
        ? [item.sourceKey.slice("exercise:".length)]
        : [],
    );
    const vocabularyIds = items.flatMap((item) =>
      item.vocabularyId ? [item.vocabularyId] : [],
    );
    const [exercises, vocabularies, translations] = await Promise.all([
      this.prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: {
          id: true,
          type: true,
          options: true,
          answer: true,
          explanation: true,
        },
      }),
      this.prisma.vocabularyEntry.findMany({
        where: { id: { in: vocabularyIds } },
        select: {
          id: true,
          term: true,
          partOfSpeech: true,
          definition: true,
        },
      }),
      this.prisma.translation.findMany({
        where: {
          locale,
          OR: [
            {
              entityType: "exercise",
              entityId: { in: exerciseIds },
              field: { in: ["explanation", "usageTip"] },
            },
            {
              entityType: "vocabulary_entry",
              entityId: { in: vocabularyIds },
              field: { in: ["definition", "usageTip"] },
            },
          ],
        },
        select: { entityType: true, entityId: true, field: true, value: true },
      }),
    ]);
    const exerciseById = new Map(
      (exercises as ReviewExercise[]).map((exercise) => [
        exercise.id,
        exercise,
      ]),
    );
    const vocabularyById = new Map(
      (vocabularies as ReviewVocabulary[]).map((vocabulary) => [
        vocabulary.id,
        vocabulary,
      ]),
    );
    const localized = new Map(
      translations.map((translation) => [
        `${translation.entityType}:${translation.entityId}:${translation.field}`,
        translation.value,
      ]),
    );

    return items.map((item) => {
      const exerciseId = item.sourceKey.startsWith("exercise:")
        ? item.sourceKey.slice("exercise:".length)
        : undefined;
      const exercise = exerciseId ? exerciseById.get(exerciseId) : undefined;
      const vocabulary = item.vocabularyId
        ? vocabularyById.get(item.vocabularyId)
        : undefined;
      const entityType = exercise ? "exercise" : "vocabulary_entry";
      const entityId = exercise?.id ?? vocabulary?.id;
      const translatedDefinition = vocabulary
        ? localized.get(`vocabulary_entry:${vocabulary.id}:definition`)
        : undefined;
      const expectedFallback = translatedDefinition ?? item.translation;
      const expression =
        quotedExpression(item.sourceText) ??
        vocabulary?.term ??
        item.sourceText;
      const explanation =
        (entityId
          ? localized.get(`${entityType}:${entityId}:explanation`)
          : undefined) ??
        (vocabulary
          ? copy.vocabularyExplanation(
              vocabulary.term,
              translatedDefinition ?? vocabulary.definition,
            )
          : (item.translation ??
            copy.correct(expectedFallback ?? item.sourceText)));
      const usageTip =
        (entityId
          ? localized.get(`${entityType}:${entityId}:usageTip`)
          : undefined) ??
        (vocabulary
          ? copy.vocabularyTip(
              vocabulary.term,
              localizedPartOfSpeech(vocabulary.partOfSpeech, locale),
            )
          : copy.exerciseTip(expression));
      return toReviewQueueItem(
        item,
        {
          explanation,
          usageTip,
          answer: exercise
            ? answerTexts(exercise, expectedFallback, copy.noAnswer)
            : {
                mode: "text",
                acceptedAnswers: expectedFallback ? [expectedFallback] : [],
                expectedAnswer: expectedFallback ?? copy.noAnswer,
              },
        },
        locale,
      );
    });
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
