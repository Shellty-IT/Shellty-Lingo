import { Injectable } from "@nestjs/common";
import type {
  ExerciseAttemptResult,
  LearningDashboard,
  LearningSessionResponse,
} from "@shellty/api-contracts";

import { BillingService } from "../billing/billing.service";
import { CourseStructureCache } from "../core/course-structure-cache";
import { PrismaService } from "../core/prisma.service";
import { gradeExercise } from "./learning-engine";
import {
  LearningContext,
  canonicalJson,
  idempotencyConflict,
  invalid,
  isRecord,
  notFound,
  parseIdempotencyKey,
  parseLanguage,
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
  ): Promise<LearningDashboard> {
    const language = parseLanguage(languageValue);
    const userCourse = await this.context.userCourse(userId, language);
    const [courses, dueReviews, progress] = await Promise.all([
      this.courseStructure.get(language),
      this.prisma.reviewItem.count({
        where: { userCourseId: userCourse.id, dueAt: { lte: new Date() } },
      }),
      this.prisma.lessonProgress.findMany({
        where: { userCourseId: userCourse.id },
        select: { lessonId: true, status: true, bestScore: true },
      }),
    ]);
    const progressByLesson = new Map(
      progress.map((row) => [row.lessonId, row]),
    );

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
    input: { idempotencyKey?: string },
  ): Promise<LearningSessionResponse> {
    const idempotencyKey = parseIdempotencyKey(input.idempotencyKey);
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
    if (lesson.premium) await this.billing.assertPremiumContentAllowed(userId);
    const language = parseLanguage(lesson.module.course.language);
    const userCourse = await this.context.userCourse(userId, language);
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
        language: parseLanguage(lesson.module.course.language),
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
}
