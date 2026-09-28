import { createHash } from "node:crypto";

import {
  ConflictException,
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from "@nestjs/common";
import type {
  CourseCategory,
  ExerciseAttemptResult,
  ExerciseTutorHintResult,
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
  EXERCISE_TUTOR_AI_PROVIDER,
  ExerciseTutorUnavailableError,
  type CompositeExerciseTutor,
} from "../ai/ai-exercise-tutor";
import {
  TRANSLATION_AI_PROVIDER,
  type TranslationAi,
} from "../ai/ai-translation";
import { moderateText } from "../ai/ai-provider";
import { estimatedTokenCostUsd } from "../ai/ai-cost";
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
import { orderingParts } from "./ordering-parts";
import { AnswerAssessmentService } from "./answer-assessment.service";
import { ReleaseService } from "../release/release.service";
import {
  learningCohort,
  LEARNING_EXPERIMENT_VERSION,
} from "../release/learning-evidence";

const normalizedTypedAnswer = (value: string): string =>
  value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");

const foldedAnswer = (value: string): string =>
  normalizedTypedAnswer(value).normalize("NFKD").replace(/\p{M}/gu, "");

const editDistance = (left: string, right: string): number => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0]!;
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previous = row[rightIndex]!;
      row[rightIndex] = Math.min(
        row[rightIndex]! + 1,
        row[rightIndex - 1]! + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return row[right.length]!;
};

export const hintRevealsReferenceAnswer = (
  hint: string,
  referenceAnswers: string[],
): boolean => {
  const foldedHint = foldedAnswer(hint);
  const hintTokens = foldedHint.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const compactHint = foldedHint.replace(/[^\p{L}\p{N}]/gu, "");
  return referenceAnswers.some((reference) => {
    const foldedReference = foldedAnswer(reference);
    if (!foldedReference) return false;
    if (foldedReference.includes(" ") && foldedHint.includes(foldedReference))
      return true;
    const referenceTokens = foldedReference
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean);
    if (
      referenceTokens.length === 1 &&
      referenceTokens.some((referenceToken) =>
        hintTokens.some(
          (hintToken) =>
            hintToken === referenceToken ||
            (referenceToken.length >= 5 &&
              Math.abs(hintToken.length - referenceToken.length) <= 1 &&
              editDistance(hintToken, referenceToken) <= 1),
        ),
      )
    )
      return true;
    const compactReference = foldedReference.replace(/[^\p{L}\p{N}]/gu, "");
    if (
      referenceTokens.length > 1 &&
      compactReference.length >= 5 &&
      compactHint.includes(compactReference)
    )
      return true;
    if (referenceTokens.length !== 1 || compactReference.length < 3)
      return false;
    const escapedLetters = [...compactReference].map((letter) =>
      letter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    return new RegExp(
      `(?:^|[^\\p{L}\\p{N}])${escapedLetters.join("[^\\p{L}\\p{N}]+")}(?:$|[^\\p{L}\\p{N}])`,
      "u",
    ).test(foldedHint);
  });
};

const fallbackExerciseHint = (
  locale: InterfaceLocale,
  type: "typed_answer" | "gap_fill",
): string => {
  const hints = {
    pl: {
      gap_fill: "Przeczytaj całe zdanie i sprawdź, jaka forma pasuje do luki.",
      typed_answer:
        "Wróć do polecenia. Ułóż odpowiedź własnymi słowami i sprawdź jej sens.",
    },
    en: {
      gap_fill: "Read the whole sentence and check which form fits the gap.",
      typed_answer:
        "Return to the task. Write your answer in your own words and check its meaning.",
    },
    th: {
      gap_fill: "อ่านทั้งประโยคแล้วดูว่ารูปคำแบบใดเหมาะกับช่องว่าง",
      typed_answer: "อ่านคำสั่งอีกครั้ง แล้วเขียนคำตอบด้วยคำของคุณเอง",
    },
  };
  return hints[locale][type];
};

const hasPrismaCode = (error: unknown, code: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === code;

const TUTOR_HINT_RESERVATION_TTL_MS = 2 * 60 * 1000;

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
    @Optional()
    @Inject(EXERCISE_TUTOR_AI_PROVIDER)
    private readonly exerciseTutor?: CompositeExerciseTutor | null,
    @Optional() private readonly release?: ReleaseService,
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
    if (
      lesson.publishedRevision.exercises.some((exercise) =>
        exercise.skillKey?.startsWith("pilot-v1."),
      ) &&
      this.release
    )
      await this.release.requireAvailable(userId, "learning_pilot");
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
        isRecord(resumed.result) && resumed.result["interfaceLocale"]
          ? this.sessionLocale(resumed.result)
          : interfaceLocale,
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
        isRecord(active.result) && active.result["interfaceLocale"]
          ? this.sessionLocale(active.result)
          : interfaceLocale,
      );
    const firstExercise = lesson.publishedRevision.exercises[0];
    let experiment: ExerciseAttemptResult["feedback"]["experiment"];
    if (
      lesson.publishedRevision.exercises.some((exercise) =>
        exercise.skillKey?.startsWith("pilot-v1."),
      ) &&
      this.release
    ) {
      await this.prisma.userCourse.updateMany({
        where: { id: userCourse.id, learningExperimentVersion: null },
        data: {
          learningExperimentVersion: LEARNING_EXPERIMENT_VERSION,
          learningExperimentCohort: learningCohort(userCourse.id),
        },
      });
      const allocation = await this.prisma.userCourse.findUnique({
        where: { id: userCourse.id },
      });
      if (
        allocation?.learningExperimentVersion === LEARNING_EXPERIMENT_VERSION &&
        (allocation.learningExperimentCohort === "control" ||
          allocation.learningExperimentCohort === "pilot")
      )
        experiment = {
          version: LEARNING_EXPERIMENT_VERSION,
          cohort: allocation.learningExperimentCohort,
        };
    }
    const session = await this.prisma.learningSession.create({
      data: {
        userCourseId: userCourse.id,
        lessonId: lesson.id,
        contentRevisionId: lesson.publishedRevision.id,
        kind: "lesson",
        idempotencyKey,
        currentExerciseId: firstExercise?.id,
        result: { interfaceLocale, ...(experiment ? { experiment } : {}) },
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
    input: {
      exerciseId?: string;
      answer?: unknown;
      idempotencyKey?: string;
    },
  ): Promise<ExerciseAttemptResult> {
    const submittedAt = new Date();
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
    const recordedResult = (
      recorded: NonNullable<typeof previous>,
    ): ExerciseAttemptResult => {
      if (
        recorded.exerciseId !== exerciseId ||
        recorded.requestHash !== answerHash
      )
        throw idempotencyConflict();
      return {
        attemptId: recorded.id,
        exerciseId: recorded.exerciseId,
        correct: recorded.correct,
        score: recorded.score,
        feedback: isRecord(recorded.feedback) ? recorded.feedback : {},
        alreadyRecorded: true,
      };
    };
    if (previous) return recordedResult(previous);
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
    // Capture help before assessment starts. A hint that completes while the
    // answer is being graded did not assist this submitted answer.
    const tutorHint = await this.prisma.exerciseTutorHint.findUnique({
      where: { sessionId_exerciseId: { sessionId, exerciseId } },
      select: { status: true, updatedAt: true },
    });
    const readingAlternative =
      exercise.type === "listening" &&
      isRecord(input.answer) &&
      input.answer["mode"] === "reading";
    if (
      exercise.type === "listening" &&
      isRecord(input.answer) &&
      input.answer["mode"] !== undefined &&
      input.answer["mode"] !== "listening" &&
      input.answer["mode"] !== "reading"
    )
      throw invalid(
        "INVALID_PRACTICE_MODE",
        "Invalid listening practice mode.",
      );
    const assisted =
      readingAlternative ||
      (tutorHint?.status === "ready" && tutorHint.updatedAt <= submittedAt);
    const gradingAnswer =
      exercise.type === "ordering"
        ? {
            correct: orderingParts(
              exercise.options,
              exercise.answer,
              undefined,
              parseLanguage(sessionLesson.module.course.language),
            ).map((part) => part.id),
          }
        : exercise.answer;
    let grade = gradeExercise(exercise.type, gradingAnswer, input.answer);
    const interfaceLocale = this.sessionLocale(session.result);
    let aiAssessment: TypedAnswerAssessmentResult | undefined;
    let assessmentMetadata: ExerciseAttemptResult["feedback"]["assessment"] = {
      status: "graded",
      source: "reference",
      policyVersion: "answer-v2",
      rubricVersion: "reference-v1",
      answerLanguage: parseLanguage(sessionLesson.module.course.language),
    };
    const submittedRecord = isRecord(input.answer) ? input.answer : undefined;
    const submittedText =
      typeof input.answer === "string"
        ? input.answer.trim()
        : typeof submittedRecord?.["text"] === "string"
          ? submittedRecord["text"].trim()
          : "";
    if (
      (exercise.type === "typed_answer" || exercise.type === "gap_fill") &&
      (!submittedText ||
        submittedText.length > 1200 ||
        !moderateText(submittedText).allowed)
    )
      throw invalid(
        "INVALID_ANSWER",
        "Answer must be valid text of at most 1200 characters.",
      );
    if (
      (exercise.type === "typed_answer" || exercise.type === "gap_fill") &&
      submittedText.length > 0 &&
      submittedText.length <= 1_200 &&
      moderateText(submittedText).allowed
    ) {
      {
        const acceptedAnswers = Array.isArray(grade.expected)
          ? grade.expected.filter(
              (answer): answer is string => typeof answer === "string",
            )
          : [];
        const outcome = await new AnswerAssessmentService(
          this.typedAnswerAssessor,
        ).assess({
          exerciseType: exercise.type,
          answerLanguage: parseLanguage(sessionLesson.module.course.language),
          interfaceLocale,
          level: sessionLesson.module.course.level,
          prompt: exercise.prompt,
          ...(exercise.instructions
            ? { instructions: exercise.instructions }
            : {}),
          acceptedAnswers,
          learnerAnswer: submittedText,
        });
        aiAssessment = outcome.teaching;
        assessmentMetadata = outcome.metadata;
        grade = {
          correct: outcome.correct,
          score: outcome.score,
          expected: outcome.expected,
        };
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
    const feedback: ExerciseAttemptResult["feedback"] = {
      ...(isRecord(session.result) &&
      isRecord(session.result["experiment"]) &&
      (session.result["experiment"]["cohort"] === "control" ||
        session.result["experiment"]["cohort"] === "pilot")
        ? {
            experiment: session.result["experiment"] as NonNullable<
              ExerciseAttemptResult["feedback"]["experiment"]
            >,
          }
        : {}),
      ...(assessmentMetadata ? { assessment: assessmentMetadata } : {}),
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
      ...(assisted ? { assisted: true } : {}),
      ...(exercise.type === "listening"
        ? {
            practiceMode: readingAlternative ? "reading" : "listening",
            listeningVerified: !readingAlternative && grade.correct,
          }
        : {}),
    };
    const ordered = sessionRevision.exercises;
    const index = ordered.findIndex((candidate) => candidate.id === exerciseId);
    const nextExercise = ordered[index + 1];
    const saveAttempt = () =>
      this.prisma.$transaction(async (transaction) => {
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
            answeredAt: submittedAt,
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
        if (!grade.correct && assessmentMetadata?.status !== "needs_review")
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
              scheduleRevision: { increment: 1 },
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
    let attempt: Awaited<ReturnType<typeof saveAttempt>>;
    try {
      attempt = await saveAttempt();
    } catch (error) {
      const winner = await this.prisma.exerciseAttempt.findUnique({
        where: { sessionId_idempotencyKey: { sessionId, idempotencyKey } },
      });
      if (winner) return recordedResult(winner);
      throw error;
    }
    await this.context.event(
      userId,
      session.userCourseId,
      null,
      "exercise_answered",
      {
        exerciseId,
        correct: grade.correct,
        score: grade.score,
        assisted,
        ...(assessmentMetadata
          ? {
              assessment: assessmentMetadata,
              independentlyCorrect: grade.correct && !assisted,
              exerciseType: exercise.type,
              contentRevisionId: sessionRevision.id,
              answerLanguage: assessmentMetadata.answerLanguage,
            }
          : {}),
        ...(exercise.type === "listening"
          ? {
              practiceMode: readingAlternative ? "reading" : "listening",
              listeningVerified: !readingAlternative && grade.correct,
            }
          : {}),
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

  async exerciseHint(
    userId: string,
    sessionId: string,
    exerciseId: string,
    learnerDraft?: string,
  ): Promise<ExerciseTutorHintResult> {
    const draft = learnerDraft?.trim() ?? "";
    if (draft.length > 1_200)
      throw invalid("ANSWER_TOO_LARGE", "Answer draft is too large.");
    if (draft && !moderateText(draft).allowed)
      throw invalid("ANSWER_REJECTED", "Answer draft could not be processed.");

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
      session.status !== "active" ||
      session.currentExerciseId !== exerciseId ||
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
    const exercise = session.contentRevision.exercises.find(
      (candidate) => candidate.id === exerciseId,
    );
    if (
      !exercise ||
      (exercise.type !== "typed_answer" && exercise.type !== "gap_fill")
    )
      throw invalid(
        "EXERCISE_TUTOR_UNAVAILABLE",
        "Tutor hints are not available for this exercise.",
      );
    const answer = isRecord(exercise.answer) ? exercise.answer : {};
    const referenceAnswers = Array.isArray(answer["accepted"])
      ? answer["accepted"].filter(
          (value): value is string => typeof value === "string",
        )
      : typeof answer["correct"] === "string"
        ? [answer["correct"]]
        : [];
    if (referenceAnswers.length === 0)
      throw invalid(
        "EXERCISE_TUTOR_UNAVAILABLE",
        "Tutor hints are not available for this exercise.",
      );

    const existing = await this.prisma.exerciseTutorHint.findUnique({
      where: { sessionId_exerciseId: { sessionId, exerciseId } },
    });
    if (
      existing?.status === "ready" &&
      existing.hint &&
      (existing.focus === "meaning" ||
        existing.focus === "grammar" ||
        existing.focus === "vocabulary" ||
        existing.focus === "word_order")
    )
      return {
        exerciseId,
        hint: existing.hint,
        focus: existing.focus,
        dynamic: existing.provider !== "local",
      };
    if (existing) {
      const staleBefore = new Date(Date.now() - TUTOR_HINT_RESERVATION_TTL_MS);
      if (existing.status === "pending" && existing.updatedAt < staleBefore) {
        const released = await this.prisma.exerciseTutorHint.deleteMany({
          where: {
            id: existing.id,
            status: "pending",
            updatedAt: { lt: staleBefore },
          },
        });
        if (released.count !== 1)
          throw new ConflictException({
            code: "EXERCISE_TUTOR_IN_PROGRESS",
            message: "A tutor hint is already being prepared.",
          });
      } else
        throw new ConflictException({
          code: "EXERCISE_TUTOR_IN_PROGRESS",
          message: "A tutor hint is already being prepared.",
        });
    }

    try {
      await this.prisma.exerciseTutorHint.create({
        data: { userId, sessionId, exerciseId },
      });
    } catch (error) {
      if (!hasPrismaCode(error, "P2002")) throw error;
      const duplicate = await this.prisma.exerciseTutorHint.findUnique({
        where: { sessionId_exerciseId: { sessionId, exerciseId } },
      });
      if (
        duplicate?.status === "ready" &&
        duplicate.hint &&
        (duplicate.focus === "meaning" ||
          duplicate.focus === "grammar" ||
          duplicate.focus === "vocabulary" ||
          duplicate.focus === "word_order")
      )
        return {
          exerciseId,
          hint: duplicate.hint,
          focus: duplicate.focus,
          dynamic: duplicate.provider !== "local",
        };
      throw new ConflictException({
        code: "EXERCISE_TUTOR_IN_PROGRESS",
        message: "A tutor hint is already being prepared.",
      });
    }

    const interfaceLocale = this.sessionLocale(session.result);
    try {
      await this.billing.assertAiMessageAllowed(userId, true);
      if (!this.exerciseTutor) throw new ExerciseTutorUnavailableError([]);
      const outcome = await this.exerciseTutor.hint({
        exerciseType: exercise.type,
        language: parseLanguage(session.lesson.module.course.language),
        interfaceLocale,
        level: session.lesson.module.course.level,
        prompt: exercise.prompt,
        ...(exercise.instructions
          ? { instructions: exercise.instructions }
          : {}),
        referenceAnswers,
        ...(draft ? { learnerDraft: draft } : {}),
      });
      const hint = outcome.result.hint.trim();
      if (
        !moderateText(hint).allowed ||
        hintRevealsReferenceAnswer(hint, referenceAnswers)
      )
        throw new ExerciseTutorUnavailableError([
          {
            provider: outcome.servedBy,
            model: outcome.servedModel,
            reason: "unsafe_hint",
          },
        ]);
      const estimatedCostUsd = estimatedTokenCostUsd(
        outcome.result.inputTokens,
        outcome.result.outputTokens,
      );
      await this.prisma.exerciseTutorHint.update({
        where: { sessionId_exerciseId: { sessionId, exerciseId } },
        data: {
          status: "ready",
          hint,
          focus: outcome.result.focus,
          provider: outcome.servedBy,
          inputTokens: outcome.result.inputTokens,
          outputTokens: outcome.result.outputTokens,
          estimatedCostUsd,
        },
      });
      await this.context.event(
        userId,
        session.userCourse.id,
        session.lesson.module.course.id,
        "exercise_hint_requested",
        {
          sessionId,
          exerciseId,
          exerciseType: exercise.type,
          focus: outcome.result.focus,
          servedBy: outcome.servedBy,
          servedModel: outcome.servedModel,
          inputTokens: outcome.result.inputTokens,
          outputTokens: outcome.result.outputTokens,
          estimatedCostUsd,
        },
      );
      return {
        exerciseId,
        hint,
        focus: outcome.result.focus,
        dynamic: true,
      };
    } catch (error) {
      if (error instanceof ExerciseTutorUnavailableError) {
        const fallback = fallbackExerciseHint(interfaceLocale, exercise.type);
        if (!hintRevealsReferenceAnswer(fallback, referenceAnswers)) {
          const focus = exercise.type === "gap_fill" ? "grammar" : "meaning";
          await this.prisma.exerciseTutorHint.update({
            where: { sessionId_exerciseId: { sessionId, exerciseId } },
            data: {
              status: "ready",
              hint: fallback,
              focus,
              provider: "local",
            },
          });
          return {
            exerciseId,
            hint: fallback,
            focus,
            dynamic: false,
          };
        }
        await this.prisma.exerciseTutorHint.deleteMany({
          where: { sessionId, exerciseId, status: "pending" },
        });
        throw new ServiceUnavailableException({
          code: "EXERCISE_TUTOR_TEMPORARILY_UNAVAILABLE",
          message: "AI exercise tutor is temporarily unavailable.",
        });
      }
      await this.prisma.exerciseTutorHint.deleteMany({
        where: { sessionId, exerciseId, status: "pending" },
      });
      throw error;
    }
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
    const graded = session.attempts.filter((attempt) => {
      const feedback = isRecord(attempt.feedback) ? attempt.feedback : {};
      return (
        !isRecord(feedback["assessment"]) ||
        feedback["assessment"]["status"] !== "needs_review"
      );
    });
    const correct = graded.filter((attempt) => attempt.correct).length;
    const score = graded.length ? correct / graded.length : 0;
    const unresolvedCount = total - graded.length;
    const independentlyCorrect = graded.filter(
      (attempt) =>
        attempt.correct &&
        (!isRecord(attempt.feedback) || attempt.feedback["assisted"] !== true),
    ).length;
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
              result: {
                ...(isRecord(session.result) ? session.result : {}),
                score,
                correct,
                total,
                unresolvedCount,
                independentlyCorrect,
                policyVersion: "answer-v2",
              },
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
    return {
      sessionId,
      score,
      correct,
      total,
      dueReviews,
      unresolvedCount,
      independentlyCorrect,
    };
  }

  private async lessonResponse(
    session: {
      id: string;
      result?: unknown;
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
        skillKey?: string | null;
        learningObjective?: string | null;
        interaction?: unknown;
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
    const [translations, tutorHints] = await Promise.all([
      this.prisma.translation.findMany({
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
                  "instructions",
                  "learningObjective",
                  "options",
                  "answerTranslation",
                  "sentenceTranslation",
                ],
              },
            },
          ],
        },
      }),
      this.prisma.exerciseTutorHint.findMany({
        where: { sessionId: session.id, status: "ready" },
        select: { exerciseId: true, hint: true, focus: true, provider: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
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
      interfaceLocale,
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
        const controlCorrection =
          isRecord(session.result) &&
          isRecord(session.result["experiment"]) &&
          session.result["experiment"]["cohort"] === "control" &&
          isRecord(exercise.interaction) &&
          exercise.interaction["kind"] === "correct_fragment";
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
        const localizedInstructions = translations.find(
          (item) =>
            item.entityType === "exercise" &&
            item.entityId === exercise.id &&
            item.locale === interfaceLocale &&
            item.field === "instructions" &&
            item.verifiedAt,
        )?.value;
        const instructions = controlCorrection
          ? undefined
          : (localizedInstructions ?? exercise.instructions);
        const selectionCount =
          exercise.type === "multiple_choice" &&
          isRecord(exercise.answer) &&
          Array.isArray(exercise.answer["correct"])
            ? exercise.answer["correct"].length
            : undefined;
        return {
          id: exercise.id,
          type: exercise.type,
          ...(exercise.skillKey ? { skillKey: exercise.skillKey } : {}),
          ...(exercise.learningObjective
            ? {
                learningObjective:
                  translated(
                    "exercise",
                    exercise.id,
                    interfaceLocale,
                    "learningObjective",
                  ) ?? exercise.learningObjective,
              }
            : {}),
          ...(!controlCorrection &&
          isRecord(exercise.interaction) &&
          exercise.interaction["kind"] === "correct_fragment" &&
          typeof exercise.interaction["before"] === "string" &&
          typeof exercise.interaction["fragment"] === "string" &&
          typeof exercise.interaction["after"] === "string"
            ? {
                interaction: exercise.interaction as NonNullable<
                  LearningSessionResponse["exercises"][number]["interaction"]
                >,
              }
            : {}),
          prompt:
            controlCorrection && isRecord(exercise.interaction)
              ? `${String(exercise.interaction["before"])}___${String(exercise.interaction["after"])}`
              : prompt,
          ...(!controlCorrection &&
          promptTranslation &&
          promptTranslation !== prompt
            ? { promptTranslation }
            : {}),
          position: exercise.position,
          answerLanguage: targetLocale,
          ...(selectionCount
            ? { responseConstraints: { selectionCount } }
            : {}),
          ...(instructions
            ? {
                instructions,
                instructionsLocale: localizedInstructions
                  ? interfaceLocale
                  : ("en" as const),
              }
            : {}),
          ...(matching ? { matching } : {}),
          ...(exercise.type !== "matching" && Array.isArray(options)
            ? {
                options: this.presentationOptions(
                  session.id,
                  exercise.id,
                  exercise.type === "ordering"
                    ? orderingParts(
                        exercise.options,
                        exercise.answer,
                        options,
                        targetLocale,
                      )
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
      hints: tutorHints.flatMap((stored) =>
        stored.hint &&
        (stored.focus === "meaning" ||
          stored.focus === "grammar" ||
          stored.focus === "vocabulary" ||
          stored.focus === "word_order")
          ? [
              {
                exerciseId: stored.exerciseId,
                hint: stored.hint,
                focus: stored.focus,
                dynamic: stored.provider !== "local",
              },
            ]
          : [],
      ),
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
