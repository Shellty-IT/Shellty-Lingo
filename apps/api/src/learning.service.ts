import { createHash } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import type {
  ContextDictionaryResult,
  CourseLanguage,
  ExerciseAttemptResult,
  InterfaceLocale,
  LearningDashboard,
  LearningSessionResponse,
  PlacementResult,
  PlacementSessionResponse,
  ReviewQueueItem,
  ReviewRating,
  ReviewResult,
} from "@shellty/api-contracts";

import { AppLogger } from "./app-logger";
import {
  gradeExercise,
  gradePlacement,
  questionsFor,
  scheduleReview,
  SRS_ALGORITHM_VERSION,
} from "./learning-engine";
import { PrismaService } from "./prisma.service";
import { BillingService } from "./billing.service";

const courseLanguages = new Set<CourseLanguage>(["en", "th"]);
const interfaceLocales = new Set<InterfaceLocale>(["pl", "en", "th"]);
const reviewRatings = new Set<ReviewRating>(["again", "hard", "good", "easy"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (isRecord(value))
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value ?? null) ?? "null";
};

const requestHash = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    @Optional() private readonly billing?: BillingService,
  ) {}

  async dashboard(
    userId: string,
    languageValue?: string,
  ): Promise<LearningDashboard> {
    const language = this.language(languageValue);
    const userCourse = await this.userCourse(userId, language);
    const [courses, dueReviews] = await Promise.all([
      this.prisma.course.findMany({
        where: { language, status: "published" },
        orderBy: { title: "asc" },
        include: {
          modules: {
            where: { status: "published" },
            orderBy: { position: "asc" },
            include: {
              lessons: {
                where: { status: "published" },
                orderBy: { position: "asc" },
                include: {
                  publishedRevision: true,
                  progress: { where: { userCourseId: userCourse.id } },
                },
              },
            },
          },
        },
      }),
      this.prisma.reviewItem.count({
        where: { userCourseId: userCourse.id, dueAt: { lte: new Date() } },
      }),
    ]);

    return {
      language,
      level: userCourse.currentLevel,
      placementCompleted: Boolean(userCourse.placementCompletedAt),
      dueReviews,
      courses: courses.map((course) => ({
        slug: course.slug,
        title: course.title,
        level: course.level,
        modules: course.modules.map((module) => ({
          slug: module.slug,
          title: module.title,
          lessons: module.lessons
            .filter(
              (lesson) => lesson.publishedRevision?.status === "published",
            )
            .map((lesson) => ({
              slug: lesson.slug,
              title: lesson.publishedRevision!.title,
              estimatedMinutes: lesson.publishedRevision!.estimatedMinutes,
              status: lesson.progress[0]?.status ?? "not_started",
              bestScore: lesson.progress[0]?.bestScore ?? 0,
            })),
        })),
      })),
    };
  }

  async startPlacement(
    userId: string,
    input: {
      language?: string;
      interfaceLocale?: string;
      idempotencyKey?: string;
    },
  ): Promise<PlacementSessionResponse> {
    const language = this.language(input.language);
    const interfaceLocale = this.locale(input.interfaceLocale ?? "pl");
    const idempotencyKey = this.key(input.idempotencyKey);
    const userCourse = await this.userCourse(userId, language);
    const previous = await this.prisma.learningSession.findUnique({
      where: {
        userCourseId_idempotencyKey: {
          userCourseId: userCourse.id,
          idempotencyKey,
        },
      },
    });
    if (previous) {
      if (previous.kind !== "placement") throw this.idempotencyConflict();
      return {
        sessionId: previous.id,
        language,
        questions: questionsFor(language, interfaceLocale),
        resumed: true,
      };
    }
    const session = await this.prisma.learningSession.create({
      data: { userCourseId: userCourse.id, kind: "placement", idempotencyKey },
    });
    await this.event(userId, userCourse.id, null, "placement_started", {
      language,
    });
    return {
      sessionId: session.id,
      language,
      questions: questionsFor(language, interfaceLocale),
      resumed: false,
    };
  }

  async submitPlacement(
    userId: string,
    sessionId: string,
    input: {
      answers?: Array<{ questionId?: string; selectedOptionId?: string }>;
    },
  ): Promise<PlacementResult> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { userCourse: true },
    });
    if (
      !session ||
      session.userCourse.userId !== userId ||
      session.kind !== "placement"
    )
      throw this.notFound("PLACEMENT_SESSION_NOT_FOUND", "Test not found.");
    if (session.status === "completed") return this.placementResult(session);

    const answers = (input.answers ?? []).flatMap((answer) =>
      answer.questionId && answer.selectedOptionId
        ? [
            {
              questionId: answer.questionId.slice(0, 80),
              selectedOptionId: answer.selectedOptionId.slice(0, 80),
            },
          ]
        : [],
    );
    const unique = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );
    if (unique.size !== answers.length)
      throw this.invalid(
        "INVALID_PLACEMENT_ANSWERS",
        "Answers must be unique.",
      );
    const language = this.language(session.userCourse.language);
    const questions = questionsFor(language);
    const questionResults = new Map(
      questions.map((question) => [question.id, question]),
    );
    if (
      answers.length !== 0 &&
      (answers.length !== questions.length ||
        answers.some((answer) => {
          const question = questionResults.get(answer.questionId);
          return !question?.options.some(
            (option) => option.id === answer.selectedOptionId,
          );
        }))
    )
      throw this.invalid(
        "INVALID_PLACEMENT_ANSWERS",
        "Submit every placement answer or skip the test.",
      );
    const result = gradePlacement(language, answers);
    const graded = answers.map((answer) => {
      const partial = gradePlacement(language, [answer]);
      return {
        sessionId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        correct:
          partial.correct === 1 && questionResults.has(answer.questionId),
      };
    });
    const completedAt = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.learningSession.updateMany({
        where: { id: sessionId, status: "active" },
        data: {
          status: "completed",
          completedAt,
          lastActivityAt: completedAt,
          correctCount: result.correct,
          totalCount: result.total,
          result: result as never,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException({
          code: "PLACEMENT_ALREADY_COMPLETED",
          message: "The placement test was already completed.",
        });
      if (graded.length)
        await transaction.placementAnswer.createMany({ data: graded });
      await transaction.userCourse.update({
        where: { id: session.userCourseId },
        data: {
          currentLevel: result.level,
          placementScore: result.score,
          placementCompletedAt: completedAt,
        },
      });
    });
    await this.event(
      userId,
      session.userCourseId,
      null,
      "placement_completed",
      {
        language,
        score: result.score,
        level: result.level,
      },
    );
    return { sessionId, ...result };
  }

  async startLesson(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    input: { idempotencyKey?: string },
  ): Promise<LearningSessionResponse> {
    const idempotencyKey = this.key(input.idempotencyKey);
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        slug: lessonSlug,
        status: "published",
        module: {
          status: "published",
          course: { slug: courseSlug, status: "published" },
        },
      },
      include: {
        module: { include: { course: true } },
        publishedRevision: {
          include: { exercises: { orderBy: { position: "asc" } } },
        },
      },
    });
    if (
      !lesson?.publishedRevision ||
      lesson.publishedRevision.status !== "published"
    )
      throw this.notFound("LESSON_NOT_FOUND", "Lesson not found.");
    if (lesson.premium) {
      if (!this.billing)
        throw new ConflictException("Billing access service is unavailable.");
      await this.billing.assertPremiumContentAllowed(userId);
    }
    const language = this.language(lesson.module.course.language);
    const userCourse = await this.userCourse(userId, language);
    const previous = await this.prisma.learningSession.findUnique({
      where: {
        userCourseId_idempotencyKey: {
          userCourseId: userCourse.id,
          idempotencyKey,
        },
      },
      include: { attempts: { orderBy: { answeredAt: "asc" } } },
    });
    if (previous) {
      if (previous.kind !== "lesson" || previous.lessonId !== lesson.id)
        throw this.idempotencyConflict();
      const resumed = await this.prisma.learningSession.findUnique({
        where: { id: previous.id },
        include: {
          attempts: { orderBy: { answeredAt: "asc" } },
          contentRevision: {
            include: { exercises: { orderBy: { position: "asc" } } },
          },
        },
      });
      if (!resumed?.contentRevision) throw this.idempotencyConflict();
      return this.lessonResponse(
        resumed,
        lesson,
        resumed.contentRevision,
        true,
      );
    }
    const firstExercise = lesson.publishedRevision.exercises[0];
    const session = await this.prisma.learningSession.create({
      data: {
        userCourseId: userCourse.id,
        lessonId: lesson.id,
        contentRevisionId: lesson.publishedRevision.id,
        kind: "lesson",
        idempotencyKey,
        currentExerciseId: firstExercise?.id,
      },
      include: { attempts: true },
    });
    await this.prisma.lessonProgress.upsert({
      where: {
        userCourseId_lessonId: {
          userCourseId: userCourse.id,
          lessonId: lesson.id,
        },
      },
      update: { status: "in_progress", lastExerciseId: firstExercise?.id },
      create: {
        userCourseId: userCourse.id,
        lessonId: lesson.id,
        status: "in_progress",
        lastExerciseId: firstExercise?.id,
      },
    });
    await this.event(
      userId,
      userCourse.id,
      lesson.module.course.id,
      "lesson_started",
      { lessonSlug, sessionId: session.id },
    );
    return this.lessonResponse(
      session,
      lesson,
      lesson.publishedRevision,
      false,
    );
  }

  async answer(
    userId: string,
    sessionId: string,
    input: { exerciseId?: string; answer?: unknown; idempotencyKey?: string },
  ): Promise<ExerciseAttemptResult> {
    const exerciseId = this.required(input.exerciseId, "exerciseId");
    const idempotencyKey = this.key(input.idempotencyKey);
    const answerHash = requestHash(input.answer);
    if (canonicalJson(input.answer).length > 10_000)
      throw this.invalid("ANSWER_TOO_LARGE", "Answer payload is too large.");
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        userCourse: true,
        lesson: true,
        contentRevision: {
          include: { exercises: { orderBy: { position: "asc" } } },
        },
      },
    });
    if (
      !session ||
      session.userCourse.userId !== userId ||
      session.kind !== "lesson" ||
      !session.lesson ||
      !session.contentRevision
    )
      throw this.notFound("LEARNING_SESSION_NOT_FOUND", "Session not found.");
    const sessionLesson = session.lesson;
    const sessionRevision = session.contentRevision;
    const previous = await this.prisma.exerciseAttempt.findUnique({
      where: { sessionId_idempotencyKey: { sessionId, idempotencyKey } },
    });
    if (previous) {
      if (
        previous.exerciseId !== exerciseId ||
        previous.requestHash !== answerHash
      )
        throw this.idempotencyConflict();
      return {
        attemptId: previous.id,
        exerciseId: previous.exerciseId,
        correct: previous.correct,
        score: previous.score,
        feedback: isRecord(previous.feedback) ? previous.feedback : {},
        alreadyRecorded: true,
      };
    }
    if (session.status !== "active")
      throw this.invalid("SESSION_COMPLETED", "Session is already completed.");
    if (session.currentExerciseId !== exerciseId)
      throw this.invalid(
        "EXERCISE_OUT_OF_ORDER",
        "Complete the current exercise before continuing.",
      );
    const exercise = sessionRevision.exercises.find(
      (candidate) => candidate.id === exerciseId,
    );
    if (!exercise)
      throw this.invalid(
        "EXERCISE_NOT_IN_SESSION",
        "Exercise is not in session.",
      );
    const grade = gradeExercise(exercise.type, exercise.answer, input.answer);
    const feedback = {
      ...(exercise.explanation ? { explanation: exercise.explanation } : {}),
      expected: grade.expected,
    };
    const ordered = sessionRevision.exercises;
    const index = ordered.findIndex((candidate) => candidate.id === exerciseId);
    const nextExercise = ordered[index + 1];
    const attempt = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.exerciseAttempt.create({
        data: {
          sessionId,
          exerciseId,
          idempotencyKey,
          requestHash: answerHash,
          answer: (input.answer ?? null) as never,
          correct: grade.correct,
          score: grade.score,
          feedback: feedback as never,
        },
      });
      await transaction.learningSession.update({
        where: { id: sessionId },
        data: {
          lastActivityAt: new Date(),
          currentExerciseId: nextExercise?.id,
          totalCount: { increment: 1 },
          ...(grade.correct ? { correctCount: { increment: 1 } } : {}),
        },
      });
      await transaction.lessonProgress.update({
        where: {
          userCourseId_lessonId: {
            userCourseId: session.userCourseId,
            lessonId: sessionLesson.id,
          },
        },
        data: { lastExerciseId: nextExercise?.id ?? exerciseId },
      });
      if (!grade.correct)
        await transaction.reviewItem.upsert({
          where: {
            userCourseId_sourceKey: {
              userCourseId: session.userCourseId,
              sourceKey: `exercise:${exercise.id}`,
            },
          },
          update: {
            sourceText: exercise.prompt,
            translation: exercise.explanation ?? "Spróbuj ponownie.",
            context: sessionRevision.title,
            dueAt: new Date(),
          },
          create: {
            userCourseId: session.userCourseId,
            sourceKey: `exercise:${exercise.id}`,
            sourceText: exercise.prompt,
            translation: exercise.explanation ?? "Spróbuj ponownie.",
            context: sessionRevision.title,
          },
        });
      return created;
    });
    await this.event(userId, session.userCourseId, null, "exercise_answered", {
      exerciseId,
      correct: grade.correct,
      score: grade.score,
    });
    return {
      attemptId: attempt.id,
      exerciseId,
      correct: grade.correct,
      score: grade.score,
      feedback,
      alreadyRecorded: false,
    };
  }

  async completeLesson(userId: string, sessionId: string) {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        userCourse: true,
        attempts: true,
        lesson: {
          include: {
            module: { include: { course: true } },
          },
        },
        contentRevision: {
          include: { vocabularyLinks: { include: { vocabulary: true } } },
        },
      },
    });
    if (
      !session ||
      session.userCourse.userId !== userId ||
      session.kind !== "lesson" ||
      !session.lesson ||
      !session.contentRevision
    )
      throw this.notFound("LEARNING_SESSION_NOT_FOUND", "Session not found.");
    const sessionLesson = session.lesson;
    const sessionRevision = session.contentRevision;
    const total = session.attempts.length;
    const correct = session.attempts.filter(
      (attempt) => attempt.correct,
    ).length;
    const score = total ? correct / total : 0;
    if (session.status === "abandoned")
      throw this.invalid("SESSION_ABANDONED", "Session was abandoned.");
    const exerciseCount = await this.prisma.exercise.count({
      where: { revisionId: sessionRevision.id },
    });
    if (session.status === "active" && total !== exerciseCount)
      throw this.invalid(
        "LESSON_INCOMPLETE",
        "Complete every exercise before finishing the lesson.",
      );
    if (session.status !== "completed") {
      const completedAt = new Date();
      const transitioned = await this.prisma.$transaction(
        async (transaction) => {
          const completed = await transaction.learningSession.updateMany({
            where: { id: sessionId, status: "active" },
            data: {
              status: "completed",
              completedAt,
              lastActivityAt: completedAt,
              result: { score, correct, total },
            },
          });
          if (completed.count !== 1) return false;
          await transaction.lessonProgress.upsert({
            where: {
              userCourseId_lessonId: {
                userCourseId: session.userCourseId,
                lessonId: sessionLesson.id,
              },
            },
            update: {
              status: "completed",
              attempts: { increment: 1 },
              completedAt,
            },
            create: {
              userCourseId: session.userCourseId,
              lessonId: sessionLesson.id,
              status: "completed",
              attempts: 1,
              bestScore: score,
              completedAt,
            },
          });
          await transaction.$executeRaw`
          UPDATE "lesson_progress"
          SET "best_score" = GREATEST("best_score", ${score})
          WHERE "user_course_id" = ${session.userCourseId}::uuid
            AND "lesson_id" = ${sessionLesson.id}::uuid
        `;
          for (const { vocabulary } of sessionRevision.vocabularyLinks) {
            await transaction.reviewItem.upsert({
              where: {
                userCourseId_sourceKey: {
                  userCourseId: session.userCourseId,
                  sourceKey: `vocabulary:${vocabulary.id}`,
                },
              },
              update: {
                sourceText: vocabulary.term,
                translation: vocabulary.definition,
                context: sessionRevision.title,
              },
              create: {
                userCourseId: session.userCourseId,
                vocabularyId: vocabulary.id,
                sourceKey: `vocabulary:${vocabulary.id}`,
                sourceText: vocabulary.term,
                translation: vocabulary.definition,
                context: sessionRevision.title,
              },
            });
          }
          return true;
        },
      );
      if (transitioned) {
        await this.event(
          userId,
          session.userCourseId,
          sessionLesson.module.course.id,
          "lesson_completed",
          { lessonId: sessionLesson.id, score },
        );
      }
    }
    const dueReviews = await this.prisma.reviewItem.count({
      where: { userCourseId: session.userCourseId, dueAt: { lte: new Date() } },
    });
    return { sessionId, score, correct, total, dueReviews };
  }

  async dictionary(
    userId: string,
    input: {
      exerciseId?: string;
      selection?: string;
      targetLocale?: string;
    },
  ): Promise<ContextDictionaryResult> {
    const exerciseId = this.required(input.exerciseId, "exerciseId");
    const selection = this.required(input.selection, "selection").slice(0, 500);
    const targetLocale = this.locale(input.targetLocale);
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        revision: {
          include: {
            lesson: { include: { module: { include: { course: true } } } },
          },
        },
      },
    });
    if (!exercise || exercise.revision.status !== "published")
      throw this.notFound("DICTIONARY_CONTEXT_NOT_FOUND", "Context not found.");
    const sourceLanguage = this.language(
      exercise.revision.lesson.module.course.language,
    );
    await this.userCourse(userId, sourceLanguage);
    const availableText = [
      exercise.prompt,
      ...(Array.isArray(exercise.options)
        ? exercise.options.flatMap((option) =>
            isRecord(option) && typeof option["text"] === "string"
              ? [option["text"]]
              : [],
          )
        : []),
    ].join(" ");
    if (
      !availableText.toLocaleLowerCase().includes(selection.toLocaleLowerCase())
    )
      throw this.invalid(
        "SELECTION_OUTSIDE_CONTEXT",
        "Selection is not part of this exercise.",
      );
    const vocabulary = await this.prisma.vocabularyEntry.findFirst({
      where: {
        language: sourceLanguage,
        term: { equals: selection, mode: "insensitive" },
      },
    });
    const translation = vocabulary
      ? await this.prisma.translation.findUnique({
          where: {
            entityType_entityId_locale_field: {
              entityType: "vocabulary_entry",
              entityId: vocabulary.id,
              locale: targetLocale,
              field: "definition",
            },
          },
        })
      : selection === exercise.prompt
        ? await this.prisma.translation.findUnique({
            where: {
              entityType_entityId_locale_field: {
                entityType: "exercise",
                entityId: exercise.id,
                locale: targetLocale,
                field: "prompt",
              },
            },
          })
        : null;
    const meaning = translation?.value ?? vocabulary?.definition;
    if (!meaning)
      throw this.notFound(
        "DICTIONARY_TRANSLATION_NOT_FOUND",
        "Translation is not available for this selection.",
      );
    return {
      sourceKey: vocabulary
        ? `vocabulary:${vocabulary.id}`
        : `selection:${sourceLanguage}:${selection.toLocaleLowerCase()}`,
      ...(vocabulary ? { vocabularyId: vocabulary.id } : {}),
      sourceLanguage,
      contextExerciseId: exercise.id,
      targetLocale,
      sourceText: selection,
      translation: meaning,
      definition: vocabulary?.definition ?? meaning,
      context: exercise.prompt,
      ...(vocabulary?.transliteration
        ? { transliteration: vocabulary.transliteration }
        : {}),
      ...(vocabulary?.toneMarks ? { toneMarks: vocabulary.toneMarks } : {}),
      speech: {
        source: {
          language: sourceLanguage === "th" ? "th-TH" : "en-GB",
          text: selection,
        },
        translation: {
          language:
            targetLocale === "pl"
              ? "pl-PL"
              : targetLocale === "th"
                ? "th-TH"
                : "en-GB",
          text: meaning,
        },
      },
    };
  }

  async saveDictionaryResult(
    userId: string,
    input: {
      exerciseId?: string;
      selection?: string;
      targetLocale?: string;
    },
  ): Promise<ReviewQueueItem> {
    const dictionary = await this.dictionary(userId, input);
    const userCourse = await this.userCourse(userId, dictionary.sourceLanguage);
    const item = await this.prisma.reviewItem.upsert({
      where: {
        userCourseId_sourceKey: {
          userCourseId: userCourse.id,
          sourceKey: dictionary.sourceKey,
        },
      },
      update: {
        sourceText: dictionary.sourceText,
        translation: dictionary.translation,
        context: dictionary.context,
      },
      create: {
        userCourseId: userCourse.id,
        sourceKey: dictionary.sourceKey,
        sourceText: dictionary.sourceText,
        translation: dictionary.translation,
        context: dictionary.context,
        ...(dictionary.vocabularyId
          ? { vocabularyId: dictionary.vocabularyId }
          : {}),
      },
    });
    await this.event(userId, userCourse.id, null, "dictionary_item_saved", {
      sourceKey: dictionary.sourceKey,
    });
    return this.reviewItem(item);
  }

  async reviews(
    userId: string,
    languageValue?: string,
  ): Promise<ReviewQueueItem[]> {
    const language = this.language(languageValue);
    const userCourse = await this.userCourse(userId, language);
    const items = await this.prisma.reviewItem.findMany({
      where: { userCourseId: userCourse.id, dueAt: { lte: new Date() } },
      orderBy: { dueAt: "asc" },
      take: 50,
    });
    return items.map((item) => this.reviewItem(item));
  }

  async review(
    userId: string,
    itemId: string,
    input: { rating?: string; idempotencyKey?: string },
  ): Promise<ReviewResult> {
    if (!reviewRatings.has(input.rating as ReviewRating))
      throw this.invalid("INVALID_REVIEW_RATING", "Invalid review rating.");
    const rating = input.rating as ReviewRating;
    const idempotencyKey = this.key(input.idempotencyKey);
    const item = await this.prisma.reviewItem.findUnique({
      where: { id: itemId },
      include: { userCourse: true },
    });
    if (!item || item.userCourse.userId !== userId)
      throw this.notFound("REVIEW_ITEM_NOT_FOUND", "Review not found.");
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
    await this.event(userId, item.userCourseId, null, "review_completed", {
      itemId,
      rating,
      intervalMinutes: next.intervalMinutes,
    });
    return {
      itemId,
      rating,
      dueAt: next.dueAt.toISOString(),
      intervalMinutes: next.intervalMinutes,
      alreadyRecorded: false,
    };
  }

  private lessonResponse(
    session: {
      id: string;
      attempts: Array<{ exerciseId: string; correct: boolean; score: number }>;
    },
    lesson: {
      slug: string;
      module: { course: { slug: string; language: string; level: string } };
    },
    revision: {
      title: string;
      summary: string | null;
      estimatedMinutes: number;
      exercises: Array<{
        id: string;
        type: LearningSessionResponse["exercises"][number]["type"];
        prompt: string;
        instructions: string | null;
        options: unknown;
        mediaAssetId: string | null;
        position: number;
      }>;
    },
    resumed: boolean,
  ): LearningSessionResponse {
    return {
      sessionId: session.id,
      resumed,
      lesson: {
        slug: lesson.slug,
        title: revision.title,
        summary: revision.summary,
        estimatedMinutes: revision.estimatedMinutes,
      },
      course: {
        slug: lesson.module.course.slug,
        language: this.language(lesson.module.course.language),
        level: lesson.module.course.level,
      },
      exercises: revision.exercises.map((exercise) => ({
        id: exercise.id,
        type: exercise.type,
        prompt: exercise.prompt,
        position: exercise.position,
        ...(exercise.instructions
          ? { instructions: exercise.instructions }
          : {}),
        ...(Array.isArray(exercise.options)
          ? {
              options: exercise.options.flatMap((option) =>
                isRecord(option) &&
                typeof option["id"] === "string" &&
                typeof option["text"] === "string"
                  ? [{ id: option["id"], text: option["text"] }]
                  : [],
              ),
            }
          : {}),
        ...(exercise.mediaAssetId
          ? { mediaAssetId: exercise.mediaAssetId }
          : {}),
      })),
      attempts: session.attempts.map((attempt) => ({
        exerciseId: attempt.exerciseId,
        correct: attempt.correct,
        score: attempt.score,
      })),
    };
  }

  private placementResult(session: {
    id: string;
    correctCount: number;
    totalCount: number;
    result: unknown;
  }): PlacementResult {
    const result = isRecord(session.result) ? session.result : {};
    const level = ["A1", "A2", "B1"].includes(String(result["level"]))
      ? (result["level"] as PlacementResult["level"])
      : "A1";
    return {
      sessionId: session.id,
      correct: session.correctCount,
      total: session.totalCount,
      score:
        typeof result["score"] === "number"
          ? result["score"]
          : session.totalCount
            ? Math.round((session.correctCount / session.totalCount) * 100)
            : 0,
      level,
    };
  }

  private reviewItem(item: {
    id: string;
    sourceText: string;
    translation: string;
    context: string | null;
    dueAt: Date;
    repetitions: number;
  }): ReviewQueueItem {
    return {
      id: item.id,
      sourceText: item.sourceText,
      translation: item.translation,
      context: item.context,
      dueAt: item.dueAt.toISOString(),
      repetitions: item.repetitions,
    };
  }

  private async userCourse(userId: string, language: CourseLanguage) {
    const course = await this.prisma.userCourse.findUnique({
      where: { userId_language: { userId, language } },
    });
    if (!course)
      throw this.notFound("USER_COURSE_NOT_FOUND", "Course is not configured.");
    return course;
  }

  private async event(
    userId: string,
    userCourseId: string | null,
    courseId: string | null,
    name: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.learningEvent.create({
      data: {
        userId,
        ...(userCourseId ? { userCourseId } : {}),
        ...(courseId ? { courseId } : {}),
        name,
        properties: properties as never,
      },
    });
    this.logger.log({ event: name, userId }, "Learning");
  }

  private language(value?: string): CourseLanguage {
    if (!courseLanguages.has(value as CourseLanguage))
      throw this.invalid("INVALID_COURSE_LANGUAGE", "Invalid course language.");
    return value as CourseLanguage;
  }

  private locale(value?: string): InterfaceLocale {
    if (!interfaceLocales.has(value as InterfaceLocale))
      throw this.invalid("INVALID_INTERFACE_LOCALE", "Invalid locale.");
    return value as InterfaceLocale;
  }

  private key(value?: string): string {
    const key = value?.trim();
    if (!key || key.length > 100 || !/^[a-zA-Z0-9:_-]+$/.test(key))
      throw this.invalid("INVALID_IDEMPOTENCY_KEY", "Invalid idempotency key.");
    return key;
  }

  private required(value: string | undefined, field: string): string {
    const result = value?.trim();
    if (!result)
      throw this.invalid("INVALID_LEARNING_INPUT", `${field} is required.`);
    return result;
  }

  private invalid(code: string, message: string): BadRequestException {
    return new BadRequestException({ code, message });
  }

  private notFound(code: string, message: string): NotFoundException {
    return new NotFoundException({ code, message });
  }

  private idempotencyConflict(): ConflictException {
    return new ConflictException({
      code: "IDEMPOTENCY_KEY_REUSED",
      message: "Idempotency key was already used for another operation.",
    });
  }
}
