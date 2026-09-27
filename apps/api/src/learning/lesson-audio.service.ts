import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ApiEnvironment } from "@shellty/config";
import type { LessonAudioResponse } from "@shellty/api-contracts";
import { API_ENVIRONMENT } from "../core/app-logger";
import { PrismaService } from "../core/prisma.service";
import { notFound } from "./learning-support";

@Injectable()
export class LessonAudioService {
  private readonly client: S3Client | null;
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
  ) {
    this.client = environment.MEDIA_S3_BUCKET
      ? new S3Client({
          region: environment.MEDIA_S3_REGION,
          ...(environment.MEDIA_S3_ENDPOINT
            ? { endpoint: environment.MEDIA_S3_ENDPOINT, forcePathStyle: true }
            : {}),
          ...(environment.MEDIA_S3_ACCESS_KEY_ID &&
          environment.MEDIA_S3_SECRET_ACCESS_KEY
            ? {
                credentials: {
                  accessKeyId: environment.MEDIA_S3_ACCESS_KEY_ID,
                  secretAccessKey: environment.MEDIA_S3_SECRET_ACCESS_KEY,
                },
              }
            : {}),
        })
      : null;
  }
  onModuleDestroy() {
    this.client?.destroy();
  }
  async audio(
    userId: string,
    sessionId: string,
    exerciseId: string,
  ): Promise<LessonAudioResponse> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        userCourse: true,
        contentRevision: {
          include: { exercises: { include: { mediaAsset: true } } },
        },
      },
    });
    const exercise = session?.contentRevision?.exercises.find(
      (item) => item.id === exerciseId,
    );
    const asset = exercise?.mediaAsset;
    if (
      !session ||
      session.userCourse.userId !== userId ||
      session.kind !== "lesson" ||
      exercise?.type !== "listening" ||
      !asset ||
      asset.kind !== "audio" ||
      !asset.contentType.startsWith("audio/") ||
      asset.byteSize <= 0
    )
      throw notFound(
        "LESSON_AUDIO_NOT_FOUND",
        "Audio not found in this session.",
      );
    if (!this.client)
      throw new ServiceUnavailableException({
        code: "LESSON_AUDIO_UNAVAILABLE",
        message: "Lesson audio storage is unavailable.",
      });
    const expiresIn = 300;
    try {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.environment.MEDIA_S3_BUCKET,
          Key: asset.storageKey,
          ResponseContentType: asset.contentType,
        }),
        { expiresIn },
      );
      return {
        url,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        code: "LESSON_AUDIO_UNAVAILABLE",
        message: "Lesson audio storage is unavailable.",
      });
    }
  }
}
