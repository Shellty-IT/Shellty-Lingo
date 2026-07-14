import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CourseLanguage,
  ExerciseContract,
  ExerciseType,
  PublishedLesson,
} from "@shellty/api-contracts";

import { AppLogger } from "./app-logger";
import { PrismaService } from "./prisma.service";

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
  typeof value === "object" && value !== null;
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
    if (!lesson?.publishedRevision)
      throw new NotFoundException({
        code: "PUBLISHED_LESSON_NOT_FOUND",
        message: "Published lesson not found.",
      });
    const revision = lesson.publishedRevision;
    return {
      course: {
        slug: lesson.module.course.slug,
        language: lesson.module.course.language as CourseLanguage,
        level: lesson.module.course.level,
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
        ...(exercise.explanation ? { explanation: exercise.explanation } : {}),
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
        level: input.level?.trim().slice(0, 20) || "A1",
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
    const last = await this.prisma.contentRevision.findFirst({
      where: { lessonId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const revision = await this.prisma.contentRevision.create({
      data: {
        lessonId,
        version: (last?.version ?? 0) + 1,
        title: this.requiredText(input.title, "Lesson title", 200),
        summary: input.summary?.trim() || null,
        estimatedMinutes: input.estimatedMinutes!,
        exercises: {
          create: input.exercises!.map((exercise, index) => ({
            position: index + 1,
            type: exercise.type,
            prompt: exercise.prompt.trim(),
            instructions: exercise.instructions?.trim(),
            options: exercise.options ?? undefined,
            answer: exercise.answer as never,
            explanation: exercise.explanation?.trim(),
            mediaAssetId: exercise.mediaAssetId,
          })),
        },
      },
      include: { exercises: true },
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
    const translation = await this.prisma.translation.upsert({
      where: {
        entityType_entityId_locale_field: {
          entityType: "lesson_revision",
          entityId: revisionId,
          locale: input.locale!,
          field: input.field,
        },
      },
      update: {
        value: input.value.trim(),
        verifiedAt: input.verified ? new Date() : null,
      },
      create: {
        entityType: "lesson_revision",
        entityId: revisionId,
        locale: input.locale!,
        field: input.field,
        value: input.value.trim(),
        ...(input.verified ? { verifiedAt: new Date() } : {}),
      },
    });
    await this.audit(actorId, "translation_saved", "revision", revisionId, {
      locale: input.locale,
      field: input.field,
      verified: Boolean(input.verified),
    });
    return translation;
  }

  async submitForReview(actorId: string, revisionId: string) {
    const revision = await this.findRevision(revisionId);
    await this.ensureComplete(revision);
    const updated = await this.prisma.contentRevision.update({
      where: { id: revisionId },
      data: { status: "review" },
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
    if (revision.status !== "review")
      throw this.invalid("Only content in review can be reviewed.");
    const updated = await this.prisma.contentRevision.update({
      where: { id: revisionId },
      data: {
        status: approved ? "review" : "draft",
        reviewedById: actorId,
        reviewedAt: new Date(),
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
    if (revision.status !== "review" || !revision.reviewedAt)
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
    await this.audit(actorId, "revision_published", "revision", revisionId, {
      version: updated.version,
    });
    return updated;
  }

  async rollback(actorId: string, lessonId: string, version: number) {
    const revision = await this.prisma.contentRevision.findUnique({
      where: { lessonId_version: { lessonId, version } },
      include: { exercises: true },
    });
    if (!revision)
      throw new NotFoundException({
        code: "REVISION_NOT_FOUND",
        message: "Revision not found.",
      });
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
    await this.audit(actorId, "revision_rolled_back", "lesson", lessonId, {
      version,
    });
    return this.findRevision(revision.id);
  }

  private async findRevision(id: string) {
    const revision = await this.prisma.contentRevision.findUnique({
      where: { id },
      include: { exercises: true },
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
      type: string;
      prompt: string;
      answer: unknown;
      options: unknown;
    }>;
  }) {
    const problems = this.revisionProblems(revision);
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
    revision.exercises.forEach((exercise, index) => {
      if (!exerciseTypes.has(exercise.type as ExerciseType))
        problems.push(`exercise ${index + 1}: unsupported type`);
      if (!exercise.prompt.trim())
        problems.push(`exercise ${index + 1}: prompt missing`);
      if (exercise.answer === null || exercise.answer === undefined)
        problems.push(`exercise ${index + 1}: answer missing`);
      if (
        ["single_choice", "multiple_choice", "matching", "ordering"].includes(
          exercise.type,
        ) &&
        !Array.isArray(exercise.options)
      )
        problems.push(`exercise ${index + 1}: options missing`);
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
