import { createHash } from "node:crypto";

import { Injectable } from "@nestjs/common";
import type {
  CourseCategory,
  ExerciseAttemptResult,
  InterfaceLocale,
  LearningDashboard,
  LearningSessionResponse,
} from "@shellty/api-contracts";

import { BillingService } from "../billing/billing.service";
import { CourseStructureCache } from "../core/course-structure-cache";
import { PrismaService } from "../core/prisma.service";
import {
  gradeExercise,
  PLACEMENT_RETAKE_AFTER_LESSONS,
} from "./learning-engine";
import {
  LearningContext,
  canonicalJson,
  idempotencyConflict,
  invalid,
  isRecord,
  notFound,
  parseIdempotencyKey,
  parseLanguage,
  parseLocale,
  requestHash,
  requireField,
} from "./learning-support";

@Injectable()
export class LessonSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: LearningContext,
    private readonly billing: BillingService,
    private readonly courseStructure: CourseStructureCache,
  ) {}

  async dashboard(
    userId: string,
    languageValue?: string,
    interfaceLocaleValue?: string,
  ): Promise<LearningDashboard> {
    const language = parseLanguage(languageValue);
    const interfaceLocale = parseLocale(interfaceLocaleValue ?? "pl");
    const userCourse = await this.context.userCourse(userId, language);
    const [courses, dueReviews, progress, lessonsCompletedSincePlacement] =
      await Promise.all([
        this.courseStructure.get(language, interfaceLocale),
        this.prisma.reviewItem.count({
          where: { userCourseId: userCourse.id, dueAt: { lte: new Date() } },
        }),
        this.prisma.lessonProgress.findMany({
          where: { userCourseId: userCourse.id },
          select: { lessonId: true, status: true, bestScore: true },
        }),
        this.prisma.lessonProgress.count({
          where: {
            userCourseId: userCourse.id,
            status: "completed",
            ...(userCourse.placementCompletedAt
              ? { completedAt: { gt: userCourse.placementCompletedAt } }
              : {}),
          },
        }),
      ]);
    const progressByLesson = new Map(
      progress.map((row) => [row.lessonId, row]),
    );

    return {
      language,
      level: userCourse.currentLevel,
      placementCompleted:
        Boolean(userCourse.placementCompletedAt) &&
        lessonsCompletedSincePlacement < PLACEMENT_RETAKE_AFTER_LESSONS,
      c1ExamAvailable: language === "en" && userCourse.currentLevel === "B2",
      c1ExamPassed: language === "en" && userCourse.currentLevel === "C1",
      dueReviews,
      courses: courses
        .filter((course) =>
          this.courseAvailableAtLevel(course.level, userCourse.currentLevel),
        )
        .map((course) => ({
          slug: course.slug,
          title: course.title,
          level: course.level,
          category: course.category,
          modules: course.modules
            .filter(
              (module) =>
                course.category !== "it" ||
                module.slug ===
                  `it-${(userCourse.currentLevel === "C1" ? "B2" : userCourse.currentLevel).toLowerCase()}`,
            )
            .map((module) => ({
              slug: module.slug,
              title: module.title,
              lessons: module.lessons.map((lesson) => {
                const learnerProgress = progressByLesson.get(lesson.id);
                return {
                  slug: lesson.slug,
                  title: lesson.title,
                  estimatedMinutes: lesson.estimatedMinutes,
                  status: learnerProgress?.status ?? "not_started",
                  bestScore: learnerProgress?.bestScore ?? 0,
                };
              }),
            })),
        })),
    };
  }

  async startLesson(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    input: { idempotencyKey?: string; interfaceLocale?: string },
  ): Promise<LearningSessionResponse> {
    const idempotencyKey = parseIdempotencyKey(input.idempotencyKey);
    const interfaceLocale = parseLocale(input.interfaceLocale ?? "pl");
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
      throw notFound("LESSON_NOT_FOUND", "Lesson not found.");
    const language = parseLanguage(lesson.module.course.language);
    const userCourse = await this.context.userCourse(userId, language);
    if (!this.lessonAvailableToLearner(lesson.module, userCourse.currentLevel))
      throw notFound("LESSON_NOT_AVAILABLE", "Lesson is not available yet.");
    if (lesson.premium) await this.billing.assertPremiumContentAllowed(userId);
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
        throw idempotencyConflict();
      const resumed = await this.prisma.learningSession.findUnique({
        where: { id: previous.id },
        include: {
          attempts: { orderBy: { answeredAt: "asc" } },
          contentRevision: {
            include: { exercises: { orderBy: { position: "asc" } } },
          },
        },
      });
      if (!resumed?.contentRevision) throw idempotencyConflict();
      return this.lessonResponse(
        resumed,
        lesson,
        resumed.contentRevision,
        true,
        interfaceLocale,
      );
    }
    const active = await this.prisma.learningSession.findFirst({
      where: {
        userCourseId: userCourse.id,
        lessonId: lesson.id,
        kind: "lesson",
        status: "active",
      },
      orderBy: { lastActivityAt: "desc" },
      include: {
        attempts: { orderBy: { answeredAt: "asc" } },
        contentRevision: {
          include: { exercises: { orderBy: { position: "asc" } } },
        },
      },
    });
    if (active?.contentRevision)
      return this.lessonResponse(
        active,
        lesson,
        active.contentRevision,
        true,
        interfaceLocale,
      );
    const firstExercise = lesson.publishedRevision.exercises[0];
    const session = await this.prisma.learningSession.create({
      data: {
        userCourseId: userCourse.id,
        lessonId: lesson.id,
        contentRevisionId: lesson.publishedRevision.id,
        kind: "lesson",
        idempotencyKey,
        currentExerciseId: firstExercise?.id,
        result: { interfaceLocale },
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
    await this.context.event(
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
      interfaceLocale,
    );
  }

  async answer(
    userId: string,
    sessionId: string,
    input: { exerciseId?: string; answer?: unknown; idempotencyKey?: string },
  ): Promise<ExerciseAttemptResult> {
    const exerciseId = requireField(input.exerciseId, "exerciseId");
    const idempotencyKey = parseIdempotencyKey(input.idempotencyKey);
    const answerHash = requestHash(input.answer);
    if (canonicalJson(input.answer).length > 10_000)
      throw invalid("ANSWER_TOO_LARGE", "Answer payload is too large.");
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
      throw notFound("LEARNING_SESSION_NOT_FOUND", "Session not found.");
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
        throw idempotencyConflict();
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
      throw invalid("SESSION_COMPLETED", "Session is already completed.");
    if (session.currentExerciseId !== exerciseId)
      throw invalid(
        "EXERCISE_OUT_OF_ORDER",
        "Complete the current exercise before continuing.",
      );
    const exercise = sessionRevision.exercises.find(
      (candidate) => candidate.id === exerciseId,
    );
    if (!exercise)
      throw invalid("EXERCISE_NOT_IN_SESSION", "Exercise is not in session.");
    const grade = gradeExercise(exercise.type, exercise.answer, input.answer);
    const interfaceLocale = this.sessionLocale(session.result);
    const explanation = await this.exerciseExplanation(
      interfaceLocale,
      exercise,
      grade.expected,
    );
    const feedback = {
      ...(explanation ? { explanation } : {}),
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
            translation: exercise.explanation ?? null,
            context: sessionRevision.title,
            dueAt: new Date(),
          },
          create: {
            userCourseId: session.userCourseId,
            sourceKey: `exercise:${exercise.id}`,
            sourceText: exercise.prompt,
            translation: exercise.explanation ?? null,
            context: sessionRevision.title,
          },
        });
      return created;
    });
    await this.context.event(
      userId,
      session.userCourseId,
      null,
      "exercise_answered",
      {
        exerciseId,
        correct: grade.correct,
        score: grade.score,
      },
    );
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
      throw notFound("LEARNING_SESSION_NOT_FOUND", "Session not found.");
    const sessionLesson = session.lesson;
    const sessionRevision = session.contentRevision;
    const total = session.attempts.length;
    const correct = session.attempts.filter(
      (attempt) => attempt.correct,
    ).length;
    const score = total ? correct / total : 0;
    if (session.status === "abandoned")
      throw invalid("SESSION_ABANDONED", "Session was abandoned.");
    const exerciseCount = await this.prisma.exercise.count({
      where: { revisionId: sessionRevision.id },
    });
    if (session.status === "active" && total !== exerciseCount)
      throw invalid(
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
          if (sessionRevision.vocabularyLinks.length > 0)
            // A session is bound to one frozen contentRevisionId, so the
            // vocabulary text captured here can't drift across repeated
            // completions of the same session — a single batched insert
            // that skips rows already in the review queue is sufficient,
            // no per-word round trip needed.
            await transaction.reviewItem.createMany({
              data: sessionRevision.vocabularyLinks.map(({ vocabulary }) => ({
                userCourseId: session.userCourseId,
                vocabularyId: vocabulary.id,
                sourceKey: `vocabulary:${vocabulary.id}`,
                sourceText: vocabulary.term,
                translation: vocabulary.definition,
                context: sessionRevision.title,
              })),
              skipDuplicates: true,
            });
          return true;
        },
      );
      if (transitioned) {
        await this.context.event(
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

  private async lessonResponse(
    session: {
      id: string;
      attempts: Array<{ exerciseId: string; correct: boolean; score: number }>;
    },
    lesson: {
      slug: string;
      module: {
        course: {
          slug: string;
          language: string;
          level: string;
          category: string;
        };
      };
    },
    revision: {
      id: string;
      title: string;
      summary: string | null;
      estimatedMinutes: number;
      exercises: Array<{
        id: string;
        type: LearningSessionResponse["exercises"][number]["type"];
        prompt: string;
        instructions: string | null;
        options: unknown;
        answer: unknown;
        mediaAssetId: string | null;
        position: number;
      }>;
    },
    resumed: boolean,
    interfaceLocale: InterfaceLocale,
  ): Promise<LearningSessionResponse> {
    const targetLocale = parseLanguage(lesson.module.course.language);
    const exerciseIds = revision.exercises.map((exercise) => exercise.id);
    const translations = await this.prisma.translation.findMany({
      where: {
        OR: [
          {
            entityType: "lesson_revision",
            entityId: revision.id,
            locale: interfaceLocale,
            field: "title",
          },
          {
            entityType: "exercise",
            entityId: { in: exerciseIds },
            locale: { in: [...new Set([interfaceLocale, targetLocale])] },
            field: "prompt",
          },
        ],
      },
    });
    const translated = (
      entityType: string,
      entityId: string,
      locale: string,
      field: string,
    ) =>
      translations.find(
        (item) =>
          item.entityType === entityType &&
          item.entityId === entityId &&
          item.locale === locale &&
          item.field === field,
      )?.value;
    return {
      sessionId: session.id,
      resumed,
      lesson: {
        slug: lesson.slug,
        title:
          translated(
            "lesson_revision",
            revision.id,
            interfaceLocale,
            "title",
          ) ?? revision.title,
        summary: revision.summary,
        estimatedMinutes: revision.estimatedMinutes,
      },
      course: {
        slug: lesson.module.course.slug,
        language: parseLanguage(lesson.module.course.language),
        level: lesson.module.course.level,
        category: lesson.module.course.category as CourseCategory,
      },
      exercises: revision.exercises.map((exercise) => {
        const prompt =
          translated("exercise", exercise.id, targetLocale, "prompt") ??
          exercise.prompt;
        const promptTranslation = this.compactPromptTranslation(
          prompt,
          translated("exercise", exercise.id, interfaceLocale, "prompt"),
        );
        const matching = this.matchingChoices(
          exercise.id,
          exercise.options,
          exercise.answer,
        );
        return {
          id: exercise.id,
          type: exercise.type,
          prompt,
          ...(promptTranslation && promptTranslation !== prompt
            ? { promptTranslation }
            : {}),
          position: exercise.position,
          ...(exercise.instructions
            ? { instructions: exercise.instructions }
            : {}),
          ...(matching ? { matching } : {}),
          ...(exercise.type !== "matching" && Array.isArray(exercise.options)
            ? {
                options: this.presentationOptions(
                  session.id,
                  exercise.id,
                  exercise.options,
                ),
              }
            : {}),
          ...(exercise.mediaAssetId
            ? { mediaAssetId: exercise.mediaAssetId }
            : {}),
        };
      }),
      attempts: session.attempts.map((attempt) => ({
        exerciseId: attempt.exerciseId,
        correct: attempt.correct,
        score: attempt.score,
      })),
    };
  }

  private sessionLocale(result: unknown): InterfaceLocale {
    const locale = isRecord(result) ? result["interfaceLocale"] : undefined;
    return locale === "en" || locale === "th" || locale === "pl"
      ? locale
      : "pl";
  }

  private presentationOptions(
    sessionId: string,
    exerciseId: string,
    options: unknown[],
  ): Array<{ id: string; text: string }> {
    const parsed = options.flatMap((option) =>
      isRecord(option) &&
      typeof option["id"] === "string" &&
      typeof option["text"] === "string"
        ? [{ id: option["id"], text: option["text"] }]
        : [],
    );
    const rank = (id: string) =>
      createHash("sha256")
        .update(`${sessionId}:${exerciseId}:${id}`)
        .digest()
        .readUInt32BE(0);
    return parsed.sort((left, right) => rank(left.id) - rank(right.id));
  }

  private compactPromptTranslation(
    source: string,
    translation?: string,
  ): string | undefined {
    if (!translation || translation === source) return undefined;
    let compact = translation;
    const quotedMatches = [
      ...translation.matchAll(/"([^"]{8,})"/g),
      ...translation.matchAll(/[“„]([^”]{8,})”/g),
      ...translation.matchAll(/'([^']{8,})'/g),
    ];
    for (const match of quotedMatches) {
      const quoted = match[1];
      if (
        quoted &&
        source
          .normalize("NFKC")
          .toLocaleLowerCase()
          .includes(quoted.normalize("NFKC").toLocaleLowerCase())
      )
        compact = compact.replace(match[0], "");
    }
    compact = compact
      .replace(/\s+([,.;!?])/g, "$1")
      .replace(/[:;,]\s*[.!?]?$/g, "")
      .trim();
    return compact.length >= 3 ? compact : undefined;
  }

  private matchingChoices(
    exerciseId: string,
    optionsValue: unknown,
    answerValue: unknown,
  ): LearningSessionResponse["exercises"][number]["matching"] | undefined {
    if (!Array.isArray(optionsValue) || !isRecord(answerValue))
      return undefined;
    const pairs = isRecord(answerValue["pairs"])
      ? answerValue["pairs"]
      : undefined;
    if (!pairs) return undefined;
    const entries = Object.entries(pairs).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    );
    if (entries.length === 0) return undefined;
    const optionText = new Map(
      optionsValue.flatMap((option) =>
        isRecord(option) &&
        typeof option["id"] === "string" &&
        typeof option["text"] === "string"
          ? [[option["id"], option["text"]] as const]
          : [],
      ),
    );
    const choice = (id: string) => ({ id, text: optionText.get(id) ?? id });
    const rank = (id: string) =>
      [...`${exerciseId}:${id}`].reduce(
        (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
        0,
      );
    const rightIds = [...new Set(entries.map(([, right]) => right))];
    return {
      left: entries.map(([left]) => choice(left)),
      right: rightIds
        .map(choice)
        .sort((left, right) => rank(left.id) - rank(right.id)),
    };
  }

  private async exerciseExplanation(
    locale: InterfaceLocale,
    exercise: {
      id: string;
      type: LearningSessionResponse["exercises"][number]["type"];
      options: unknown;
      explanation: string | null;
    },
    expected: unknown,
  ): Promise<string | undefined> {
    const translationClient = (
      this.prisma as unknown as {
        translation?: {
          findUnique(input: unknown): Promise<{ value: string } | null>;
        };
      }
    ).translation;
    const localized = translationClient
      ? await translationClient.findUnique({
          where: {
            entityType_entityId_locale_field: {
              entityType: "exercise",
              entityId: exercise.id,
              locale,
              field: "explanation",
            },
          },
        })
      : null;
    if (localized?.value) return localized.value;
    if (locale === "en" && exercise.explanation) return exercise.explanation;

    const options = Array.isArray(exercise.options)
      ? exercise.options.flatMap((option) =>
          isRecord(option) &&
          typeof option["id"] === "string" &&
          typeof option["text"] === "string"
            ? [{ id: option["id"], text: option["text"] }]
            : [],
        )
      : [];
    const expectedValues: string[] = Array.isArray(expected)
      ? expected.filter((value): value is string => typeof value === "string")
      : typeof expected === "string"
        ? [expected]
        : [];
    const expectedTexts = expectedValues.map(
      (value) => options.find((option) => option.id === value)?.text ?? value,
    );
    const quoted = expectedTexts.map((value) => `"${value}"`).join(", ");
    if (locale === "pl") {
      if (exercise.type === "ordering")
        return `Poprawna kolejność tworzy zdanie: "${expectedTexts.join(" ")}".`;
      if (exercise.type === "multiple_choice")
        return `Poprawne odpowiedzi to: ${quoted}.`;
      if (exercise.type === "gap_fill" || exercise.type === "typed_answer")
        return `Przykładowa poprawna odpowiedź to ${quoted}.`;
      return quoted ? `Poprawna odpowiedź to ${quoted}.` : undefined;
    }
    if (locale === "th")
      return quoted
        ? `คำตอบที่ถูกต้องคือ ${quoted}`
        : (exercise.explanation ?? undefined);
    return (
      exercise.explanation ??
      (quoted ? `The correct answer is ${quoted}.` : undefined)
    );
  }

  private courseAvailableAtLevel(
    courseLevel: string,
    learnerLevel: string,
  ): boolean {
    const ranks: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
    const minimum = courseLevel.match(/A1|A2|B1|B2|C1/)?.[0] ?? "A1";
    return (ranks[minimum] ?? 1) <= (ranks[learnerLevel] ?? 1);
  }

  private lessonAvailableToLearner(
    module: {
      slug: string;
      course: { level: string; category: string };
    },
    learnerLevel: string,
  ): boolean {
    if (!this.courseAvailableAtLevel(module.course.level, learnerLevel))
      return false;
    if (module.course.category !== "it") return true;
    const effectiveLevel = learnerLevel === "C1" ? "B2" : learnerLevel;
    return module.slug === `it-${effectiveLevel.toLocaleLowerCase()}`;
  }
}
