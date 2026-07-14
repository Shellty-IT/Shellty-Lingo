import { BadRequestException, Injectable } from "@nestjs/common";
import type { CourseLanguage } from "@shellty/api-contracts";
import {
  gradeListeningChallenge,
  listeningChallenges,
} from "./listening-engine";
import { PrismaService } from "./prisma.service";
import { ReleaseService } from "./release.service";

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
    if (!optionId || !idempotencyKey || idempotencyKey.length > 100)
      throw new BadRequestException("Complete the listening attempt.");
    const result = gradeListeningChallenge(challengeId, optionId);
    if (!result)
      throw new BadRequestException("Unknown listening challenge or option.");
    const existing = await this.prisma.learningEvent.findFirst({
      where: {
        userId,
        name: "listening_attempt",
        properties: { path: ["idempotencyKey"], equals: idempotencyKey },
      },
    });
    if (!existing) {
      await this.prisma.learningEvent.create({
        data: {
          userId,
          name: result.correct ? "listening_completed" : "listening_attempt",
          properties: {
            challengeId,
            correct: result.correct,
            idempotencyKey,
            minutes: 2,
          },
        },
      });
    }
    return result;
  }

  private language(value?: string): CourseLanguage {
    if (value === "en" || value === "th") return value;
    throw new BadRequestException("Language must be en or th.");
  }
}
