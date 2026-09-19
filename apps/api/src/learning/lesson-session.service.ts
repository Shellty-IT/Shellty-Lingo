import { createHash } from "node:crypto";

import { Inject, Injectable, Optional } from "@nestjs/common";
import type {
  CourseCategory,
  ExerciseAttemptResult,
  InterfaceLocale,
  LearningDashboard,
  LearningSessionResponse,
} from "@shellty/api-contracts";

import {
  TYPED_ANSWER_AI_PROVIDER,
  type CompositeTypedAnswerAssessor,
  type TypedAnswerAssessmentResult,
} from "../ai/ai-answer-assessment";
import {
  TRANSLATION_AI_PROVIDER,
  type TranslationAi,
} from "../ai/ai-translation";
import { moderateText } from "../ai/ai-provider";
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

const normalizedTypedAnswer = (value: string): string =>
  value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");

const localizedExerciseOptions = (
  options: unknown,
  serializedTranslation?: string,
): unknown => {
  if (!serializedTranslation || !Array.isArray(options)) return options;
  try {
    const translated = JSON.parse(serializedTranslation) as unknown;
    if (!Array.isArray(translated)) return options;
    const base = options.flatMap((option) =>
      isRecord(option) &&
      typeof option["id"] === "string" &&
      typeof option["text"] === "string"
        ? [{ id: option["id"], text: option["text"] }]
        : [],
    );
    const localized = translated.flatMap((option) =>
      isRecord(option) &&
      typeof option["id"] === "string" &&
      typeof option["text"] === "string"
        ? [{ id: option["id"], text: option["text"] }]
        : [],
    );
    const baseIds = new Set(base.map((option) => option.id));
    return localized.length === base.length &&
      localized.every((option) => baseIds.has(option.id))
      ? localized
      : options;
  } catch {
    return options;
  }
};

@Injectable()
export class LessonSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: LearningContext,
    private readonly billing: BillingService,
    private readonly courseStructure: CourseStructureCache,
    @Optional()
    @Inject(TYPED_ANSWER_AI_PROVIDER)
    private readonly typedAnswerAssessor?: CompositeTypedAnswerAssessor | null,
    @Optional()
    @Inject(TRANSLATION_AI_PROVIDER)
    private readonly translator?: TranslationAi | null,
  ) {}

  async dashboard(
    userId: string,
    languageValue?: string,
    interfaceLocaleValue?: string,
  ): Promise<LearningDashboard> {
    const language = parseLanguage(languageValue);
    const interfaceLocale = parseLocale(interfaceLocaleValue ?? "en");
    const userCourse = await this.context.userCourse(userId, language);
    const [courses, dueReviews, progress, lessonsCompletedSincePlacement] =
      await Promise.all([
        this.courseStructure.get(
          language,
          userCourse.currentLevel,
          interfaceLocale,
        ),
        this.prisma.reviewItem.count({
          where: {
            userCourseId: userCourse.id,
            level: userCourse.currentLevel,
            dueAt: { lte: new Date() },
          },
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
        .filter((course) => course.level === userCourse.currentLevel)
        .map((course) => ({
          slug: course.slug,
          title: course.title,
          level: course.level,
          category: course.category,
          modules: course.modules.map((module) => ({
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
    const interfaceLocale = parseLocale(input.interfaceLocale ?? "en");
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
    if (
      !this.lessonAvailableToLearner(lesson.module, userCourse.currentLevel) ||
      !this.revisionAvailableAtLevel(
        lesson.publishedRevision.exercises,
        lesson.module.course.level,
      )
    )
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
        lesson: { include: { module: { include: { course: true } } } },
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
    if (
      session.userCourse.currentLevel !== session.lesson.module.course.level ||
      !this.revisionAvailableAtLevel(
        session.contentRevision.exercises,
        session.lesson.module.course.level,
      )
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
    const gradingAnswer =
      exercise.type === "ordering"
        ? {
            correct: this.orderingCorrectIds(exercise.options, exercise.answer),
          }
        : exercise.answer;
    let grade = gradeExercise(exercise.type, gradingAnswer, input.answer);
    const interfaceLocale = this.sessionLocale(session.result);
    let aiAssessment: TypedAnswerAssessmentResult | undefined;
    const submittedRecord = isRecord(input.answer) ? input.answer : undefined;
    const submittedText =
      typeof input.answer === "string"
        ? input.answer.trim()
        : typeof submittedRecord?.["text"] === "string"
          ? submittedRecord["text"].trim()
          : "";
    if (
      (exercise.type === "typed_answer" || exercise.type === "gap_fill") &&
      this.typedAnswerAssessor &&
      submittedText.length > 0 &&
      submittedText.length <= 1_200 &&
      moderateText(submittedText).allowed
    ) {
      try {
        const acceptedAnswers = Array.isArray(grade.expected)
          ? grade.expected.filter(
              (answer): answer is string => typeof answer === "string",
            )
          : [];
        const outcome = await this.typedAnswerAssessor.assess({
          exerciseType: exercise.type,
          language: parseLanguage(sessionLesson.module.course.language),
          interfaceLocale,
          level: sessionLesson.module.course.level,
          prompt: exercise.prompt,
          ...(exercise.instructions
            ? { instructions: exercise.instructions }
            : {}),
          acceptedAnswers,
          learnerAnswer: submittedText,
        });
        const safeAssessment = moderateText(
          `${outcome.result.suggestedAnswer} ${outcome.result.explanation} ${outcome.result.usageTip} ${outcome.result.examples.join(" ")}`,
        ).allowed;
        const suggestedMatchesGapAnswer = acceptedAnswers.some(
          (answer) =>
            normalizedTypedAnswer(answer) ===
            normalizedTypedAnswer(outcome.result.suggestedAnswer),
        );
        if (
          safeAssessment &&
          exercise.type === "gap_fill" &&
          suggestedMatchesGapAnswer
        ) {
          aiAssessment = outcome.result;
        } else if (
          safeAssessment &&
          exercise.type === "typed_answer" &&
          (outcome.result.verdict === "correct" ||
            normalizedTypedAnswer(outcome.result.suggestedAnswer) !==
              normalizedTypedAnswer(submittedText))
        ) {
          const exactMatch = grade.correct;
          const aiCorrect = outcome.result.verdict === "correct";
          // A remote model cannot invalidate an exact, reviewed reference
          // answer or replace its feedback with a contradictory correction.
          if (!exactMatch || aiCorrect) {
            aiAssessment = outcome.result;
            grade = {
              correct: exactMatch || aiCorrect,
              score:
                exactMatch || aiCorrect
                  ? 1
                  : outcome.result.verdict === "almost"
                    ? 0.5
                    : 0,
              expected: [outcome.result.suggestedAnswer],
            };
          }
        }
      } catch {
        // AI degradation must never block a lesson. The deterministic grade and
        // reviewed explanation remain the safe fallback.
      }
    }
    const explanation =
      aiAssessment?.explanation ??
      (await this.exerciseExplanation(
        interfaceLocale,
        sessionLesson.module.course.language === "th" ? "th" : "en",
        exercise,
        grade.expected,
      ));
    const usageTip = aiAssessment
      ? `${aiAssessment.usageTip}\n• ${aiAssessment.examples[0]}\n• ${aiAssessment.examples[1]}`
      : undefined;
    const feedback = {
      ...(explanation ? { explanation } : {}),
      ...(usageTip ? { usageTip } : {}),
      expected: grade.expected,
      ...(exercise.type === "ordering"
        ? {
            expectedText: this.orderingSentence(
              exercise.options,
              exercise.answer,
            ),
          }
        : {}),
      ...(aiAssessment ? { dynamic: true } : {}),
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
            exerciseId: exercise.id,
            level: sessionLesson.module.course.level,
            sourceText: exercise.prompt,
            translation: explanation ?? exercise.explanation ?? null,
            explanation: explanation ?? exercise.explanation ?? null,
            ...(usageTip ? { usageTip } : {}),
            context: sessionRevision.title,
            dueAt: new Date(),
          },
          create: {
            userCourseId: session.userCourseId,
            exerciseId: exercise.id,
            level: sessionLesson.module.course.level,
            sourceKey: `exercise:${exercise.id}`,
            sourceText: exercise.prompt,
            translation: explanation ?? exercise.explanation ?? null,
            explanation: explanation ?? exercise.explanation ?? null,
            usageTip: usageTip ?? null,
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
          include: {
            exercises: { select: { level: true } },
            vocabularyLinks: { include: { vocabulary: true } },
          },
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
    if (
      session.userCourse.currentLevel !== session.lesson.module.course.level ||
      !this.revisionAvailableAtLevel(
        session.contentRevision.exercises,
        session.lesson.module.course.level,
      )
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
                level: sessionLesson.module.course.level,
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
      where: {
        userCourseId: session.userCourseId,
        level: sessionLesson.module.course.level,
        dueAt: { lte: new Date() },
      },
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
        level: string;
      }>;
    },
    resumed: boolean,
    interfaceLocale: InterfaceLocale,
  ): Promise<LearningSessionResponse> {
    if (
      !this.revisionAvailableAtLevel(
        revision.exercises,
        lesson.module.course.level,
      )
    )
      throw notFound("LESSON_NOT_AVAILABLE", "Lesson is not available yet.");
    const targetLocale = parseLanguage(lesson.module.course.language);
    const exerciseIds = revision.exercises.map((exercise) => exercise.id);
    const translations = await this.prisma.translation.findMany({
      where: {
        OR: [
          {
            entityType: "lesson_revision",
            entityId: revision.id,
            locale: interfaceLocale,
            field: { in: ["title", "summary"] },
          },
          {
            entityType: "exercise",
            entityId: { in: exerciseIds },
            locale: { in: [...new Set([interfaceLocale, targetLocale])] },
            field: {
              in: [
                "prompt",
                "options",
                "answerTranslation",
                "sentenceTranslation",
              ],
            },
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
    const lessonTitle =
      translated("lesson_revision", revision.id, interfaceLocale, "title") ??
      revision.title;
    const lessonSummary =
      translated("lesson_revision", revision.id, interfaceLocale, "summary") ??
      (interfaceLocale === "pl"
        ? `Przećwicz temat: ${lessonTitle}.`
        : interfaceLocale === "th"
          ? `ฝึกหัวข้อ: ${lessonTitle}`
          : revision.summary);
    const sentenceTranslations = new Map<string, string>();
    await Promise.all(
      revision.exercises
        .filter(
          (exercise) =>
            exercise.type === "ordering" || exercise.type === "listening",
        )
        .map(async (exercise) => {
          const reviewed =
            translated(
              "exercise",
              exercise.id,
              interfaceLocale,
              "sentenceTranslation",
            ) ??
            (exercise.type === "ordering"
              ? translated(
                  "exercise",
                  exercise.id,
                  interfaceLocale,
                  "answerTranslation",
                )
              : undefined);
          if (reviewed) {
            sentenceTranslations.set(exercise.id, reviewed);
            return;
          }
          const sentence =
            exercise.type === "ordering"
              ? this.orderingSentence(exercise.options, exercise.answer)
              : this.listeningSentence(exercise.prompt);
          if (!sentence || !this.translator || interfaceLocale === targetLocale)
            return;
          try {
            const translation = await this.translator.translate({
              text: sentence,
              sourceLanguage: targetLocale,
              targetLocale: interfaceLocale,
            });
            if (translation.trim())
              sentenceTranslations.set(exercise.id, translation.trim());
          } catch {
            // A translation outage must not prevent the lesson from opening.
          }
        }),
    );
    return {
      sessionId: session.id,
      resumed,
      lesson: {
        slug: lesson.slug,
        title: lessonTitle,
        summary: lessonSummary,
        estimatedMinutes: revision.estimatedMinutes,
      },
      course: {
        slug: lesson.module.course.slug,
        language: parseLanguage(lesson.module.course.language),
        level: lesson.module.course.level,
        category: lesson.module.course.category as CourseCategory,
      },
      exercises: revision.exercises.map((exercise) => {
        const sourcePrompt =
          translated("exercise", exercise.id, targetLocale, "prompt") ??
          exercise.prompt;
        const prompt =
          exercise.type === "listening"
            ? this.listeningSentence(sourcePrompt)
            : sourcePrompt;
        const promptTranslation =
          exercise.type === "ordering" || exercise.type === "listening"
            ? sentenceTranslations.get(exercise.id)
            : this.compactPromptTranslation(
                prompt,
                translated("exercise", exercise.id, interfaceLocale, "prompt"),
              );
        const matching = this.matchingChoices(
          exercise.id,
          exercise.options,
          exercise.answer,
        );
        const options = localizedExerciseOptions(
          exercise.options,
          translated("exercise", exercise.id, interfaceLocale, "options"),
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
          ...(exercise.type !== "matching" && Array.isArray(options)
            ? {
                options: this.presentationOptions(
                  session.id,
                  exercise.id,
                  exercise.type === "ordering"
                    ? this.orderingPresentationOptions(options)
                    : options,
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
      : "en";
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

  private orderingPresentationOptions(
    options: unknown[],
  ): Array<{ id: string; text: string }> {
    return options.flatMap((option) => {
      if (
        !isRecord(option) ||
        typeof option["id"] !== "string" ||
        typeof option["text"] !== "string"
      )
        return [];
      const optionId = option["id"];
      const words = option["text"].match(/[\p{L}\p{M}\p{N}'’/-]+/gu) ?? [];
      return words.map((word, index) => ({
        id: `${optionId}::${index}`,
        text: word.toLocaleLowerCase(),
      }));
    });
  }

  private orderingCorrectIds(options: unknown, answer: unknown): string[] {
    if (!Array.isArray(options) || !isRecord(answer)) return [];
    const correct = Array.isArray(answer["correct"])
      ? answer["correct"].filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    const optionById = new Map(
      options.flatMap((option) =>
        isRecord(option) &&
        typeof option["id"] === "string" &&
        typeof option["text"] === "string"
          ? [[option["id"], option["text"]] as const]
          : [],
      ),
    );
    return correct.flatMap((id) => {
      const text = optionById.get(id);
      if (!text) return [];
      const wordCount = text.match(/[\p{L}\p{M}\p{N}'’/-]+/gu)?.length ?? 0;
      return Array.from({ length: wordCount }, (_, index) => `${id}::${index}`);
    });
  }

  private orderingSentence(options: unknown, answer: unknown): string {
    if (!Array.isArray(options) || !isRecord(answer)) return "";
    const correct = Array.isArray(answer["correct"])
      ? answer["correct"].filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    const optionById = new Map(
      options.flatMap((option) =>
        isRecord(option) &&
        typeof option["id"] === "string" &&
        typeof option["text"] === "string"
          ? [[option["id"], option["text"]] as const]
          : [],
      ),
    );
    return correct
      .map((id) => optionById.get(id) ?? "")
      .filter(Boolean)
      .join(" ")
      .replace(/\s+([,.;!?])/gu, "$1")
      .trim();
  }

  private listeningSentence(prompt: string): string {
    return prompt.replace(/^\s*(?:listen|odsłuchaj|ฟัง)\s*:\s*/iu, "").trim();
  }

  private compactPromptTranslation(
    source: string,
    translation?: string,
  ): string | undefined {
    if (!translation || translation === source) return undefined;
    let compact = translation;
    const quotedMatches = [
      ...translation.matchAll(/"([^"]+)"/g),
      ...translation.matchAll(/[\u201c\u201e]([^\u201d]+)\u201d/g),
      ...translation.matchAll(/'([^']+)'/g),
    ];
    for (const match of quotedMatches) {
      const quoted = match[1];
      const matchIndex = match.index ?? 0;
      const beforeQuote = translation.slice(0, matchIndex).trimEnd();
      const afterQuote = translation.slice(matchIndex + match[0].length).trim();
      const isTrailingExample =
        beforeQuote.endsWith(":") && /^[.!?]?$/.test(afterQuote);
      if (
        quoted &&
        isTrailingExample &&
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
    language: "en" | "th",
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
    if (exercise.type === "gap_fill" && expectedTexts[0]) {
      const dictionaryExplanation = await this.gapDictionaryExplanation(
        locale,
        language,
        exercise.id,
        expectedTexts[0],
      );
      if (dictionaryExplanation) return dictionaryExplanation;
    }
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

  private async gapDictionaryExplanation(
    locale: InterfaceLocale,
    language: "en" | "th",
    exerciseId: string,
    answer: string,
  ): Promise<string | undefined> {
    const exerciseClient = (
      this.prisma as unknown as {
        exercise?: {
          findUnique(input: unknown): Promise<{
            prompt: string;
            revision: {
              vocabularyLinks: Array<{
                vocabulary: { id: string; term: string };
              }>;
            };
          } | null>;
        };
      }
    ).exercise;
    if (typeof exerciseClient?.findUnique !== "function") return undefined;
    const record = await exerciseClient.findUnique({
      where: { id: exerciseId },
      select: {
        prompt: true,
        revision: {
          select: {
            vocabularyLinks: {
              select: { vocabulary: { select: { id: true, term: true } } },
            },
          },
        },
      },
    });
    if (!record) return undefined;
    const normalized = (value: string) =>
      value.normalize("NFKC").trim().toLocaleLowerCase();
    const singular = (value: string) =>
      language === "en" && value.endsWith("s") ? value.slice(0, -1) : value;
    const normalizedAnswer = normalized(answer);
    const vocabulary = record.revision.vocabularyLinks
      .map((link) => link.vocabulary)
      .find((entry) => {
        const term = normalized(entry.term);
        return (
          term === normalizedAnswer ||
          singular(term) === singular(normalizedAnswer)
        );
      });
    if (!vocabulary) return undefined;
    const translationClient = (
      this.prisma as unknown as {
        translation?: {
          findUnique(input: unknown): Promise<{ value: string } | null>;
        };
      }
    ).translation;
    const translation = translationClient
      ? await translationClient.findUnique({
          where: {
            entityType_entityId_locale_field: {
              entityType: "vocabulary_entry",
              entityId: vocabulary.id,
              locale,
              field: "definition",
            },
          },
        })
      : null;
    if (!translation?.value) return undefined;
    const completed = record.prompt.replace(/_{2,}|\.{3,}/u, answer);
    if (locale === "pl")
      return `„${answer}” oznacza „${translation.value}”. To słowo pasuje znaczeniowo i gramatycznie; po jego wstawieniu powstaje pełne zdanie: „${completed}”.`;
    if (locale === "th")
      return `“${answer}” หมายถึง “${translation.value}” คำนี้เหมาะกับบริบทและไวยากรณ์ เมื่อเติมแล้วจะได้ประโยคเต็มว่า “${completed}”`;
    return `“${answer}” means “${translation.value}”. It fits the meaning and grammar of the sentence; the complete sentence is: “${completed}”.`;
  }

  private courseAvailableAtLevel(
    courseLevel: string,
    learnerLevel: string,
  ): boolean {
    return courseLevel === learnerLevel;
  }

  private lessonAvailableToLearner(
    module: {
      slug: string;
      course: { level: string; category: string };
    },
    learnerLevel: string,
  ): boolean {
    return this.courseAvailableAtLevel(module.course.level, learnerLevel);
  }

  private revisionAvailableAtLevel(
    exercises: Array<{ level: string }>,
    level: string,
  ): boolean {
    return (
      exercises.length > 0 && exercises.every((item) => item.level === level)
    );
  }
}
