import { createHash } from "node:crypto";

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CourseLanguage,
  InterfaceLocale,
  ReviewQueueItem,
} from "@shellty/api-contracts";

import { AppLogger } from "../core/app-logger";
import { PrismaService } from "../core/prisma.service";

const courseLanguages = new Set<CourseLanguage>(["en", "th"]);
const interfaceLocales = new Set<InterfaceLocale>(["pl", "en", "th"]);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (isRecord(value))
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value ?? null) ?? "null";
};

export const requestHash = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

export const invalid = (code: string, message: string): BadRequestException =>
  new BadRequestException({ code, message });

export const notFound = (code: string, message: string): NotFoundException =>
  new NotFoundException({ code, message });

export const idempotencyConflict = (): ConflictException =>
  new ConflictException({
    code: "IDEMPOTENCY_KEY_REUSED",
    message: "Idempotency key was already used for another operation.",
  });

export function parseLanguage(value?: string): CourseLanguage {
  if (!courseLanguages.has(value as CourseLanguage))
    throw invalid("INVALID_COURSE_LANGUAGE", "Invalid course language.");
  return value as CourseLanguage;
}

export function parseLocale(value?: string): InterfaceLocale {
  if (!interfaceLocales.has(value as InterfaceLocale))
    throw invalid("INVALID_INTERFACE_LOCALE", "Invalid locale.");
  return value as InterfaceLocale;
}

export function parseIdempotencyKey(value?: string): string {
  const key = value?.trim();
  if (!key || key.length > 100 || !/^[a-zA-Z0-9:_-]+$/.test(key))
    throw invalid("INVALID_IDEMPOTENCY_KEY", "Invalid idempotency key.");
  return key;
}

export function requireField(value: string | undefined, field: string): string {
  const result = value?.trim();
  if (!result) throw invalid("INVALID_LEARNING_INPUT", `${field} is required.`);
  return result;
}

export const toReviewQueueItem = (item: {
  id: string;
  sourceText: string;
  translation: string | null;
  context: string | null;
  dueAt: Date;
  repetitions: number;
}): ReviewQueueItem => ({
  id: item.id,
  sourceText: item.sourceText,
  translation: item.translation,
  context: item.context,
  dueAt: item.dueAt.toISOString(),
  repetitions: item.repetitions,
});

/**
 * Shared per-request collaborators of the learning services: resolving the
 * caller's course participation and recording learning events.
 */
@Injectable()
export class LearningContext {
  constructor(
    private readonly prisma: PrismaService,
    readonly logger: AppLogger,
  ) {}

  async userCourse(userId: string, language: CourseLanguage) {
    const course = await this.prisma.userCourse.findUnique({
      where: { userId_language: { userId, language } },
    });
    if (!course)
      throw notFound("USER_COURSE_NOT_FOUND", "Course is not configured.");
    return course;
  }

  async event(
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
}
