import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import type { CourseLanguage, InterfaceLocale } from "@shellty/api-contracts";
import {
  gradeListeningChallenge,
  listeningChallengeLanguage,
  listeningChallenges,
  type ListeningLevel,
} from "./listening-engine";
import { PrismaService } from "../core/prisma.service";
import { ReleaseService } from "../release/release.service";

@Injectable()
export class ListeningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly release: ReleaseService,
  ) {}

  async catalog(userId: string, languageValue?: string, localeValue?: string) {
    await this.release.requireAvailable(userId, "listening_lab");
    const language = this.language(languageValue);
    const locale = this.locale(localeValue);
    const userCourse = await this.prisma.userCourse.findUnique({
      where: { userId_language: { userId, language } },
    });
    if (!userCourse)
      throw new BadRequestException({
        code: "USER_COURSE_NOT_FOUND",
        message: "Course profile is not configured.",
      });
    const level = this.level(userCourse.currentLevel);
    const recentAttempts = await this.prisma.learningEvent.findMany({
      where: {
        userId,
        userCourseId: userCourse.id,
        name: { in: ["listening_completed", "listening_attempt"] },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { properties: true },
    });
    const seen = new Set(
      recentAttempts.flatMap((event) => {
        const properties = event.properties as { challengeId?: unknown };
        return typeof properties.challengeId === "string"
          ? [properties.challengeId]
          : [];
      }),
    );
    const catalog = listeningChallenges(language, level, locale);
    return [
      ...catalog.filter((challenge) => !seen.has(challenge.id)),
      ...catalog.filter((challenge) => seen.has(challenge.id)),
    ];
  }

  async attempt(
    userId: string,
    challengeId: string,
    input: {
      optionId?: string;
      idempotencyKey?: string;
      interfaceLocale?: string;
    },
  ) {
    await this.release.requireAvailable(userId, "listening_lab");
    const optionId = input.optionId?.trim();
    const idempotencyKey = input.idempotencyKey?.trim();
    if (
      !optionId ||
      !idempotencyKey ||
      idempotencyKey.length > 100 ||
      !/^[a-zA-Z0-9:_-]+$/.test(idempotencyKey)
    )
      throw new BadRequestException({
        code: "INVALID_LISTENING_ATTEMPT",
        message: "Complete the listening attempt.",
      });
    const locale = this.locale(input.interfaceLocale);
    const result = gradeListeningChallenge(challengeId, optionId, locale);
    if (!result)
      throw new BadRequestException({
        code: "LISTENING_CHALLENGE_NOT_FOUND",
        message: "Unknown listening challenge or option.",
      });
    const language = listeningChallengeLanguage(challengeId);
    if (!language)
      throw new BadRequestException({
        code: "LISTENING_CHALLENGE_NOT_FOUND",
        message: "Unknown listening challenge.",
      });
    const userCourse = await this.prisma.userCourse.findUnique({
      where: { userId_language: { userId, language } },
    });
    if (!userCourse)
      throw new BadRequestException({
        code: "USER_COURSE_NOT_FOUND",
        message: "Course profile is not configured.",
      });
    const existing = await this.prisma.learningEvent.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
    if (existing) {
      const properties = existing.properties as {
        challengeId?: unknown;
        optionId?: unknown;
      };
      if (
        properties.challengeId !== challengeId ||
        properties.optionId !== optionId
      )
        throw new ConflictException({
          code: "IDEMPOTENCY_KEY_REUSED",
          message: "Idempotency key was reused for another listening attempt.",
        });
      return result;
    }
    await this.prisma.learningEvent.create({
      data: {
        userId,
        userCourseId: userCourse.id,
        idempotencyKey,
        name: result.correct ? "listening_completed" : "listening_attempt",
        properties: {
          challengeId,
          optionId,
          correct: result.correct,
          minutes: 2,
        },
      },
    });
    return result;
  }

  private language(value?: string): CourseLanguage {
    if (value === "en" || value === "th") return value;
    throw new BadRequestException({
      code: "INVALID_COURSE_LANGUAGE",
      message: "Language must be en or th.",
    });
  }

  private locale(value?: string): InterfaceLocale {
    if (value === undefined || value === "pl") return "pl";
    if (value === "en" || value === "th") return value;
    throw new BadRequestException({
      code: "INVALID_INTERFACE_LOCALE",
      message: "Interface locale must be pl, en or th.",
    });
  }

  private level(value: string): ListeningLevel {
    if (["A1", "A2", "B1", "B2", "C1"].includes(value))
      return value as ListeningLevel;
    return "A1";
  }
}
