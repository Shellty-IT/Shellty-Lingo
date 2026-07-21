import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import type { CourseLanguage } from "@shellty/api-contracts";
import {
  gradeListeningChallenge,
  listeningChallenges,
} from "./listening-engine";
import { PrismaService } from "../core/prisma.service";
import { ReleaseService } from "../release/release.service";

@Injectable()
export class ListeningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly release: ReleaseService,
  ) {}

  async catalog(userId: string, languageValue?: string) {
    await this.release.requireAvailable(userId, "listening_lab");
    return listeningChallenges(this.language(languageValue));
  }

  async attempt(
    userId: string,
    challengeId: string,
    input: { optionId?: string; idempotencyKey?: string },
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
      throw new BadRequestException("Complete the listening attempt.");
    const result = gradeListeningChallenge(challengeId, optionId);
    if (!result)
      throw new BadRequestException("Unknown listening challenge or option.");
    const language = this.language(
      listeningChallenges("en").some((item) => item.id === challengeId)
        ? "en"
        : "th",
    );
    const userCourse = await this.prisma.userCourse.findUnique({
      where: { userId_language: { userId, language } },
    });
    if (!userCourse)
      throw new BadRequestException("Course profile is not configured.");
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
    throw new BadRequestException("Language must be en or th.");
  }
}
