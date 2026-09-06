import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CourseLanguage,
  CourseCategory,
  ExerciseContract,
  ExerciseType,
  PublishedLesson,
} from "@shellty/api-contracts";
import type { LearningLevel } from "../generated/prisma/client";

import { AppLogger } from "../core/app-logger";
import { CourseStructureCache } from "../core/course-structure-cache";
import { PrismaService } from "../core/prisma.service";
import { exerciseFingerprint } from "./exercise-identity";

const requiredLocales = ["pl", "en", "th"];
const exerciseTypes = new Set<ExerciseType>([
  "single_choice",
  "multiple_choice",
  "matching",
  "gap_fill",
  "typed_answer",
  "ordering",
  "listening",
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isExerciseOptions = (
  value: unknown,
): value is NonNullable<ExerciseContract["options"]> =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      isRecord(item) &&
      typeof item["id"] === "string" &&
      typeof item["text"] === "string",
  );

type RevisionInput = {
  title?: string;
  summary?: string;
  estimatedMinutes?: number;
  exercises?: ExerciseContract[];
};

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly courseStructure: CourseStructureCache,
  ) {}

  conversationReports() {
    return this.prisma.conversationReport.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        reporter: { select: { email: true } },
        conversation: {
          select: {
            scenarioId: true,
            userCourse: { select: { language: true } },
          },
        },
      },
    });
  }

  async publishedCourses(language?: CourseLanguage) {
    return this.prisma.course.findMany({
      where: { status: "published", ...(language ? { language } : {}) },
      orderBy: { title: "asc" },
      select: {
        slug: true,
        language: true,
        level: true,
        category: true,
        title: true,
        description: true,
        modules: {
          where: { status: "published" },
          orderBy: { position: "asc" },
          select: { slug: true, title: true, position: true },
        },
      },
    });
  }

  async publishedLesson(
    userId: string,
    courseSlug: string,
    lessonSlug: string,
  ): Promise<PublishedLesson> {
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
      throw new NotFoundException({
        code: "PUBLISHED_LESSON_NOT_FOUND",
        message: "Published lesson not found.",
      });
    const revision = lesson.publishedRevision;
    const userCourse = await this.prisma.userCourse.findUnique({
      where: {
        userId_language: {
          userId,
          language: lesson.module.course.language,
        },
      },
      select: { currentLevel: true },
    });
    if (
      !userCourse ||
      userCourse.currentLevel !== lesson.module.course.level ||
      revision.exercises.some(
        (exercise) => exercise.level !== lesson.module.course.level,
      )
    )
      throw new NotFoundException({
        code: "PUBLISHED_LESSON_NOT_FOUND",
        message: "Published lesson not found.",
      });
    return {
      course: {
        slug: lesson.module.course.slug,
        language: lesson.module.course.language as CourseLanguage,
        level: lesson.module.course.level,
        category: lesson.module.course.category as CourseCategory,
      },
      module: {
        slug: lesson.module.slug,
        title: lesson.module.title,
        position: lesson.module.position,
      },
      lesson: {
        slug: lesson.slug,
        title: revision.title,
        summary: revision.summary,
        estimatedMinutes: revision.estimatedMinutes,
        version: revision.version,
      },
      exercises: revision.exercises.map((exercise) => ({
        id: exercise.id,
        type: exercise.type,
        prompt: exercise.prompt,
        ...(exercise.instructions
          ? { instructions: exercise.instructions }
          : {}),
        ...(isExerciseOptions(exercise.options)
          ? { options: exercise.options }
          : {}),
        ...(exercise.mediaAssetId
          ? { mediaAssetId: exercise.mediaAssetId }
          : {}),
      })),
    };
  }

  async listWorkspace() {
    return this.prisma.course.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        modules: {
          orderBy: { position: "asc" },
          include: {
            lessons: {
              orderBy: { position: "asc" },
              include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
            },
          },
        },
      },
    });
  }

  async createCourse(
    actorId: string,
    input: {
      slug?: string;
      language?: string;
      level?: string;
      category?: string;
      title?: string;
      description?: string;
    },
  ) {
    const slug = this.slug(input.slug);
    if (!input.title?.trim() || !["en", "th"].includes(input.language ?? ""))
      throw this.invalid("A course needs a language and title.");
    const course = await this.prisma.course.create({
      data: {
        slug,
        language: input.language!,
        level: this.level(input.level),
        category: this.category(input.category),
        title: input.title.trim().slice(0, 200),
        description: input.description?.trim(),
      },
    });
    await this.audit(actorId, "course_created", "course", course.id, { slug });
    return course;
  }

  async createModule(
    actorId: string,
    courseId: string,
    input: { slug?: string; title?: string; position?: number },
  ) {
    const module = await this.prisma.courseModule.create({
      data: {
        courseId,
        slug: this.slug(input.slug),
        title: this.requiredText(input.title, "Module title", 200),
        position: this.position(input.position),
      },
    });
    await this.audit(actorId, "module_created", "module", module.id, {
      courseId,
    });
    return module;
  }

  async createLesson(
    actorId: string,
    moduleId: string,
    input: { slug?: string; position?: number },
  ) {
    const lesson = await this.prisma.lesson.create({
      data: {
        moduleId,
        slug: this.slug(input.slug),
        position: this.position(input.position),
      },
    });
    await this.audit(actorId, "lesson_created", "lesson", lesson.id, {
      moduleId,
    });
    return lesson;
  }

  async createRevision(
    actorId: string,
    lessonId: string,
    input: RevisionInput,
  ) {
    this.validateRevisionInput(input);
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        module: {
          select: { course: { select: { language: true, level: true } } },
        },
      },
    });
    if (!lesson)
      throw new NotFoundException({
        code: "LESSON_NOT_FOUND",
        message: "Lesson not found.",
      });
    const { language, level } = lesson.module.course;
    const preparedExercises = input.exercises!.map((exercise, index) => ({
      position: index + 1,
      level,
      contentFingerprint: exerciseFingerprint({
        language,
        type: exercise.type,
        prompt: exercise.prompt,
        options: exercise.options,
      }),
      type: exercise.type,
      prompt: exercise.prompt.trim(),
      instructions: exercise.instructions?.trim(),
      options: exercise.options ?? undefined,
      answer: exercise.answer as never,
      explanation: exercise.explanation?.trim(),
      mediaAssetId: exercise.mediaAssetId,
    }));
    const duplicateIdentity = preparedExercises.find(
      (exercise, index) =>
        preparedExercises.findIndex(
          (candidate) =>
            candidate.contentFingerprint === exercise.contentFingerprint,
        ) !== index,
    );
    if (duplicateIdentity)
      throw this.invalid("A revision cannot contain the same task twice.");
    const existingIdentities = await this.prisma.exerciseIdentity.findMany({
      where: {
        fingerprint: {
          in: preparedExercises.map((exercise) => exercise.contentFingerprint),
        },
      },
      select: { fingerprint: true, level: true },
    });
    if (existingIdentities.some((identity) => identity.level !== level))
      throw this.invalid(
        "A task already assigned to another learning level cannot be reused.",
      );
    const revision = await this.prisma.$transaction(async (transaction) => {
      await transaction.exerciseIdentity.createMany({
        data: preparedExercises.map((exercise) => ({
          fingerprint: exercise.contentFingerprint,
          level,
        })),
        skipDuplicates: true,
      });
      const last = await transaction.contentRevision.findFirst({
        where: { lessonId },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      return transaction.contentRevision.create({
        data: {
          lessonId,
          version: (last?.version ?? 0) + 1,
          title: this.requiredText(input.title, "Lesson title", 200),
          summary: input.summary?.trim() || null,
          estimatedMinutes: input.estimatedMinutes!,
          exercises: { create: preparedExercises },
        },
        include: { exercises: true },
      });
    });
    await this.audit(actorId, "revision_created", "revision", revision.id, {
      lessonId,
      version: revision.version,
    });
    return revision;
  }

  async upsertTranslation(
    actorId: string,
    revisionId: string,
    input: {
      exerciseId?: string;
      locale?: string;
      field?: string;
      value?: string;
      verified?: boolean;
    },
  ) {
    if (
      !requiredLocales.includes(input.locale ?? "") ||
      !input.field ||
      !input.value?.trim()
    )
      throw this.invalid("Translation locale, field and value are required.");
    const revision = await this.findRevision(revisionId);
    const exerciseId = input.exerciseId?.trim();
    const entityType = exerciseId ? "exercise" : "lesson_revision";
    const entityId = exerciseId ?? revisionId;
    if (
      exerciseId &&
      !revision.exercises.some((item) => item.id === exerciseId)
    )
      throw this.invalid("Exercise does not belong to this revision.");
    const allowedFields = exerciseId
      ? ["prompt", "explanation", "usageTip"]
      : ["title", "summary"];
    if (!allowedFields.includes(input.field))
      throw this.invalid(`Field must be one of: ${allowedFields.join(", ")}.`);
    const translation = await this.prisma.translation.upsert({
      where: {
        entityType_entityId_locale_field: {
          entityType,
          entityId,
          locale: input.locale!,
          field: input.field,
        },
      },
      update: {
        value: input.value.trim(),
        verifiedAt: input.verified ? new Date() : null,
      },
      create: {
        entityType,
        entityId,
        locale: input.locale!,
        field: input.field,
        value: input.value.trim(),
        ...(input.verified ? { verifiedAt: new Date() } : {}),
      },
    });
    await this.audit(actorId, "translation_saved", "revision", revisionId, {
      locale: input.locale,
      field: input.field,
      ...(exerciseId ? { exerciseId } : {}),
      verified: Boolean(input.verified),
    });
    return translation;
  }

  async submitForReview(actorId: string, revisionId: string) {
    const revision = await this.findRevision(revisionId);
    if (revision.status === "review" && !revision.reviewedAt) return revision;
    if (revision.status !== "draft")
      throw this.invalid("Only a draft revision can be submitted for review.");
    await this.ensureComplete(revision);
    const updated = await this.prisma.contentRevision.update({
      where: { id: revisionId },
      data: {
        status: "review",
        reviewedById: null,
        reviewedAt: null,
        reviewNote: null,
      },
    });
    await this.audit(actorId, "revision_submitted", "revision", revisionId, {
      version: updated.version,
    });
    return updated;
  }

  async review(
    actorId: string,
    revisionId: string,
    approved: boolean,
    note?: string,
  ) {
    const revision = await this.findRevision(revisionId);
    if (approved && revision.status === "review" && revision.reviewedAt)
      return revision;
    if (!approved && revision.status === "draft" && revision.reviewNote)
      return revision;
    if (revision.status !== "review")
      throw this.invalid("Only content in review can be reviewed.");
    if (approved) {
      const creation = await this.prisma.contentAuditEntry.findFirst({
        where: {
          action: "revision_created",
          resourceType: "revision",
          resourceId: revisionId,
        },
        orderBy: { createdAt: "asc" },
        select: { actorId: true },
      });
      if (!creation?.actorId)
        throw this.invalid("The revision author could not be determined.");
      if (creation.actorId === actorId)
        throw this.invalid(
          "A revision must be approved by an independent reviewer.",
        );
    }
    const updated = await this.prisma.contentRevision.update({
      where: { id: revisionId },
      data: approved
        ? {
            status: "review",
            reviewedById: actorId,
            reviewedAt: new Date(),
            reviewNote: note?.trim() || null,
          }
        : {
            status: "draft",
            reviewedById: null,
            reviewedAt: null,
            reviewNote: note?.trim() || null,
          },
    });
    await this.audit(
      actorId,
      approved ? "revision_approved" : "revision_returned",
      "revision",
      revisionId,
      {},
    );
    return updated;
  }

  async publish(actorId: string, revisionId: string) {
    const revision = await this.findRevision(revisionId);
    if (revision.status === "published") return revision;
    if (
      revision.status !== "review" ||
      !revision.reviewedAt ||
      !revision.reviewedById
    )
      throw this.invalid("A reviewed revision is required before publication.");
    await this.ensureComplete(revision);
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.contentRevision.updateMany({
        where: { lessonId: revision.lessonId, status: "published" },
        data: { status: "archived" },
      });
      const published = await tx.contentRevision.update({
        where: { id: revisionId },
        data: { status: "published", publishedAt: now, publishedById: actorId },
      });
      const lesson = await tx.lesson.update({
        where: { id: revision.lessonId },
        data: { status: "published", publishedRevisionId: revisionId },
        include: { module: true },
      });
      await tx.courseModule.update({
        where: { id: lesson.moduleId },
        data: { status: "published" },
      });
      await tx.course.update({
        where: { id: lesson.module.courseId },
        data: { status: "published" },
      });
      return published;
    });
    this.courseStructure.invalidate();
    await this.audit(actorId, "revision_published", "revision", revisionId, {
      version: updated.version,
    });
    return updated;
  }

  async rollback(actorId: string, lessonId: string, version: number) {
    const revision = await this.prisma.contentRevision.findUnique({
      where: { lessonId_version: { lessonId, version } },
      include: {
        exercises: true,
        lesson: { include: { module: { include: { course: true } } } },
      },
    });
    if (!revision)
      throw new NotFoundException({
        code: "REVISION_NOT_FOUND",
        message: "Revision not found.",
      });
    if (revision.status === "published") return revision;
    if (
      !["archived", "published"].includes(revision.status) ||
      !revision.reviewedAt ||
      !revision.reviewedById
    )
      throw this.invalid(
        "Only a previously reviewed publication can be restored.",
      );
    await this.ensureComplete(revision);
    await this.prisma.$transaction(async (tx) => {
      await tx.contentRevision.updateMany({
        where: { lessonId, status: "published" },
        data: { status: "archived" },
      });
      await tx.contentRevision.update({
        where: { id: revision.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          publishedById: actorId,
        },
      });
      await tx.lesson.update({
        where: { id: lessonId },
        data: { status: "published", publishedRevisionId: revision.id },
      });
    });
    this.courseStructure.invalidate();
    await this.audit(actorId, "revision_rolled_back", "lesson", lessonId, {
      version,
    });
    return this.findRevision(revision.id);
  }

  private async findRevision(id: string) {
    const revision = await this.prisma.contentRevision.findUnique({
      where: { id },
      include: {
        exercises: true,
        lesson: { include: { module: { include: { course: true } } } },
      },
    });
    if (!revision)
      throw new NotFoundException({
        code: "REVISION_NOT_FOUND",
        message: "Revision not found.",
      });
    return revision;
  }

  private async ensureComplete(revision: {
    id: string;
    title: string;
    estimatedMinutes: number;
    exercises: Array<{
      id: string;
      type: string;
      prompt: string;
      answer: unknown;
      options: unknown;
      level: LearningLevel;
      contentFingerprint: string;
    }>;
    lesson: { module: { course: { level: LearningLevel } } };
  }) {
    const problems = this.revisionProblems(revision);
    const courseLevel = revision.lesson.module.course.level;
    revision.exercises.forEach((exercise, index) => {
      if (exercise.level !== courseLevel)
        problems.push(
          `exercise ${index + 1}: level does not match course level ${courseLevel}`,
        );
    });
    const translations = await this.prisma.translation.findMany({
      where: {
        entityType: "lesson_revision",
        entityId: revision.id,
        field: "title",
        verifiedAt: { not: null },
      },
      select: { locale: true },
    });
    const missingLocales = requiredLocales.filter(
      (locale) => !translations.some((item) => item.locale === locale),
    );
    if (missingLocales.length)
      problems.push(
        `verified title translations missing: ${missingLocales.join(", ")}`,
      );
    const exerciseTranslations = await this.prisma.translation.findMany({
      where: {
        entityType: "exercise",
        entityId: { in: revision.exercises.map((exercise) => exercise.id) },
        field: "prompt",
        verifiedAt: { not: null },
      },
      select: { entityId: true, locale: true },
    });
    revision.exercises.forEach((exercise, index) => {
      const missingExerciseLocales = requiredLocales.filter(
        (locale) =>
          !exerciseTranslations.some(
            (translation) =>
              translation.entityId === exercise.id &&
              translation.locale === locale,
          ),
      );
      if (missingExerciseLocales.length)
        problems.push(
          `exercise ${index + 1}: verified prompt translations missing: ${missingExerciseLocales.join(", ")}`,
        );
    });
    if (problems.length)
      throw new BadRequestException({
        code: "CONTENT_INCOMPLETE",
        message: "Content cannot be published.",
        details: problems,
      });
  }

  private revisionProblems(revision: {
    title: string;
    estimatedMinutes: number;
    exercises: Array<{
      type: string;
      prompt: string;
      answer: unknown;
      options?: unknown;
      contentFingerprint?: string;
    }>;
  }): string[] {
    const problems: string[] = [];
    if (!revision.title.trim()) problems.push("title missing");
    if (
      !Number.isInteger(revision.estimatedMinutes) ||
      revision.estimatedMinutes < 1
    )
      problems.push("estimated minutes invalid");
    if (!revision.exercises.length)
      problems.push("at least one exercise is required");
    const fingerprints = revision.exercises.flatMap((exercise) =>
      exercise.contentFingerprint ? [exercise.contentFingerprint] : [],
    );
    if (new Set(fingerprints).size !== fingerprints.length)
      problems.push("the same task cannot appear twice in one revision");
    revision.exercises.forEach((exercise, index) => {
      const label = `exercise ${index + 1}`;
      if (!exerciseTypes.has(exercise.type as ExerciseType))
        problems.push(`${label}: unsupported type`);
      if (!exercise.prompt.trim()) problems.push(`${label}: prompt missing`);
      const answer = isRecord(exercise.answer) ? exercise.answer : null;
      if (!answer) problems.push(`${label}: answer missing or invalid`);
      const options = isExerciseOptions(exercise.options)
        ? exercise.options
        : [];
      const optionIds = options.map((option) => option.id.trim());
      const optionIdSet = new Set(optionIds);
      const requiresOptions = [
        "single_choice",
        "multiple_choice",
        "matching",
        "ordering",
        "listening",
      ].includes(exercise.type);
      if (requiresOptions && options.length === 0)
        problems.push(`${label}: options missing or invalid`);
      if (
        options.some((option) => !option.id.trim() || !option.text.trim()) ||
        optionIdSet.size !== optionIds.length
      )
        problems.push(
          `${label}: option identifiers and text must be unique and non-empty`,
        );
      const correct = answer?.["correct"];
      if (["single_choice", "listening"].includes(exercise.type)) {
        if (typeof correct !== "string" || !optionIdSet.has(correct))
          problems.push(`${label}: correct option is missing or invalid`);
      }
      if (exercise.type === "multiple_choice") {
        const ids = Array.isArray(correct)
          ? correct.filter(
              (value): value is string => typeof value === "string",
            )
          : [];
        if (
          ids.length === 0 ||
          ids.length !== new Set(ids).size ||
          ids.some((id) => !optionIdSet.has(id))
        )
          problems.push(`${label}: correct options are missing or invalid`);
      }
      if (exercise.type === "ordering") {
        const ids = Array.isArray(correct)
          ? correct.filter(
              (value): value is string => typeof value === "string",
            )
          : [];
        if (
          ids.length !== optionIds.length ||
          new Set(ids).size !== optionIdSet.size ||
          ids.some((id) => !optionIdSet.has(id))
        )
          problems.push(
            `${label}: ordering answer must contain every option once`,
          );
      }
      if (["gap_fill", "typed_answer"].includes(exercise.type)) {
        const accepted = answer?.["accepted"];
        const hasAccepted =
          Array.isArray(accepted) &&
          accepted.some((value) => typeof value === "string" && value.trim());
        const hasCorrect = typeof correct === "string" && correct.trim();
        if (!hasAccepted && !hasCorrect)
          problems.push(`${label}: accepted answer is missing`);
      }
      if (exercise.type === "matching") {
        const pairs = isRecord(answer?.["pairs"]) ? answer["pairs"] : {};
        const entries = Object.entries(pairs).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        );
        const matchingOptionIds = new Set(options.map((option) => option.id));
        if (entries.length === 0)
          problems.push(`exercise ${index + 1}: matching pairs missing`);
        if (
          entries.some(
            ([left, right]) =>
              !matchingOptionIds.has(left) ||
              !matchingOptionIds.has(right) ||
              left === right,
          )
        )
          problems.push(`exercise ${index + 1}: matching pair option missing`);
        if (new Set(entries.map(([, right]) => right)).size !== entries.length)
          problems.push(`exercise ${index + 1}: matching pairs must be unique`);
      }
    });
    return problems;
  }

  private validateRevisionInput(input: RevisionInput) {
    const problems = this.revisionProblems({
      title: input.title ?? "",
      estimatedMinutes: input.estimatedMinutes ?? 0,
      exercises: input.exercises ?? [],
    });
    if (problems.length) throw this.invalid(problems.join("; "));
  }
  private requiredText(
    value: string | undefined,
    name: string,
    maximum: number,
  ) {
    if (!value?.trim()) throw this.invalid(`${name} is required.`);
    return value.trim().slice(0, maximum);
  }
  private slug(value?: string) {
    const slug = value?.trim().toLowerCase();
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw this.invalid(
        "Slug must use lowercase letters, digits and hyphens.",
      );
    return slug;
  }
  private position(value?: number) {
    if (!Number.isInteger(value) || value! < 1)
      throw this.invalid("Position must be a positive integer.");
    return value!;
  }
  private category(value?: string): CourseCategory {
    if (value === undefined || value === "general") return "general";
    if (
      value === "vocabulary" ||
      value === "phrases" ||
      value === "business" ||
      value === "it"
    )
      return value;
    throw this.invalid("Unknown course category.");
  }
  private level(value?: string): LearningLevel {
    if (
      value === "A1" ||
      value === "A2" ||
      value === "B1" ||
      value === "B2" ||
      value === "C1"
    )
      return value;
    throw this.invalid("A course must use exactly one supported level.");
  }
  private invalid(message: string) {
    return new BadRequestException({ code: "INVALID_CONTENT", message });
  }
  private async audit(
    actorId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ) {
    await this.prisma.contentAuditEntry.create({
      data: {
        actorId,
        action,
        resourceType,
        resourceId,
        metadata: metadata as never,
      },
    });
    this.logger.log({ actorId, action, resourceType, resourceId }, "Content");
  }
}
