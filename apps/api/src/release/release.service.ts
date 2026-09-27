import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type {
  BetaReadinessResponse,
  BetaTelemetryEvent,
  FeatureFlagContract,
  FeatureFlagKey,
  ProductBaselineResponse,
  ReleaseConfigResponse,
} from "@shellty/api-contracts";
import {
  betaTelemetryEvents,
  betaTelemetryPropertyKeys,
  featureFlagKeys,
} from "@shellty/api-contracts";
import type { ApiEnvironment } from "@shellty/config";
import { API_ENVIRONMENT, AppLogger } from "../core/app-logger";
import {
  buildReleaseGates,
  calculateBetaMetrics,
  calculateProductBaseline,
  featureRolloutBucket,
} from "./release-engine";
import { PrismaService } from "../core/prisma.service";
import { learningEvidence, percentile } from "./learning-evidence";

interface FlagOverride {
  enabled: boolean;
  rolloutPercent: number;
  reason: string;
}

const metadataPrefix = "release.flag.";

@Injectable()
export class ReleaseService {
  async learningReport(windowDays = 90) {
    const now = new Date();
    const window = Number.isFinite(windowDays)
      ? Math.min(180, Math.max(37, Math.round(windowDays)))
      : 90;
    const since = new Date(now.getTime() - window * 86400000);
    const [attempts, events] = await Promise.all([
      this.prisma.exerciseAttempt.findMany({
        take: 10001,
        orderBy: { answeredAt: "asc" },
        where: {
          answeredAt: { gte: since },
          session: { userCourse: { user: { role: "learner" } } },
        },
        select: {
          answeredAt: true,
          correct: true,
          feedback: true,
          exercise: {
            select: {
              skillKey: true,
              contentFingerprint: true,
              level: true,
              type: true,
            },
          },
          session: {
            select: {
              userCourseId: true,
              userCourse: { select: { language: true } },
            },
          },
        },
      }),
      this.prisma.learningEvent.findMany({
        take: 10001,
        orderBy: { createdAt: "asc" },
        where: {
          createdAt: { gte: since },
          user: { role: "learner" },
          name: {
            in: [
              "exercise_presented",
              "exercise_result_received",
              "lesson_start_timing",
              "audio_problem",
              "review_batch_completed",
              "learning_comfort",
            ],
          },
        },
        select: { name: true, properties: true },
      }),
    ]);
    const timings = events.flatMap((event) => {
      const p = event.properties as Record<string, unknown>;
      return typeof p["durationMs"] === "number" && p["durationMs"] >= 0
        ? [{ name: event.name, ms: p["durationMs"] }]
        : [];
    });
    const truncated = attempts.length > 10000 || events.length > 10000;
    const report = learningEvidence(
      attempts.slice(0, 10000).map((attempt) => ({
        ...attempt.exercise,
        exerciseType: attempt.exercise.type,
        userCourseId: attempt.session.userCourseId,
        language: attempt.session.userCourse.language,
        correct: attempt.correct,
        answeredAt: attempt.answeredAt,
        feedback: attempt.feedback,
      })),
      now,
    );
    const ratings = events
      .filter((event) => event.name === "learning_comfort")
      .flatMap((event) => {
        const value = (event.properties as Record<string, unknown>)["rating"];
        return typeof value === "number" &&
          Number.isInteger(value) &&
          value >= 1 &&
          value <= 5
          ? [value]
          : [];
      });
    const priced = attempts.flatMap((attempt) => {
      const metadata = (attempt.feedback as Record<string, unknown>)[
        "assessment"
      ];
      if (!metadata || typeof metadata !== "object") return [];
      const cost = (metadata as Record<string, unknown>)["estimatedCostUsd"];
      return typeof cost === "number" && cost >= 0 ? [cost] : [];
    });
    return {
      generatedAt: now.toISOString(),
      windowDays: window,
      ...report,
      truncated,
      recommendation: truncated
        ? ("needs_data" as const)
        : report.recommendation,
      latency: ["exercise_result_received", "lesson_start_timing"].map(
        (name) => {
          const values = timings
            .filter((sample) => sample.name === name)
            .map((sample) => sample.ms);
          return {
            name,
            count: values.length,
            p50Ms: percentile(values, 0.5),
            p95Ms: percentile(values, 0.95),
          };
        },
      ),
      audioProblems: events.filter((event) => event.name === "audio_problem")
        .length,
      completedBatches: events.filter(
        (event) => event.name === "review_batch_completed",
      ).length,
      comfort: {
        responses: ratings.length,
        average: ratings.length
          ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
          : null,
      },
      aiCost: {
        pricedAttempts: priced.length,
        estimatedUsd: priced.length
          ? priced.reduce((sum, value) => sum + value, 0)
          : null,
        actualBilledUsd: null,
      },
    };
  }
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
  ) {}

  async config(userId: string): Promise<ReleaseConfigResponse> {
    return {
      channel: this.channel(),
      beta: this.environment.APP_ENV !== "production",
      flags: await this.flags(userId),
    };
  }

  async isAvailable(userId: string, key: FeatureFlagKey): Promise<boolean> {
    const flag = (await this.flags(userId)).find((item) => item.key === key);
    return flag?.available === true;
  }

  async requireAvailable(userId: string, key: FeatureFlagKey): Promise<void> {
    if (!(await this.isAvailable(userId, key)))
      throw new ServiceUnavailableException({
        code: "FEATURE_DISABLED",
        message: "This feature is currently unavailable.",
      });
  }

  async updateFlag(
    actorId: string,
    keyValue: string,
    input: {
      enabled?: boolean;
      rolloutPercent?: number;
      reason?: string;
    },
  ): Promise<FeatureFlagContract> {
    if (!featureFlagKeys.includes(keyValue as FeatureFlagKey))
      throw new BadRequestException({
        code: "UNKNOWN_FEATURE_FLAG",
        message: "Unknown feature flag.",
      });
    const key = keyValue as FeatureFlagKey;
    const rolloutPercent = input.rolloutPercent ?? 0;
    const reason = input.reason?.trim() ?? "Updated by release operator.";
    if (
      typeof input.enabled !== "boolean" ||
      !Number.isInteger(rolloutPercent) ||
      rolloutPercent < 0 ||
      rolloutPercent > 100 ||
      reason.length < 3 ||
      reason.length > 180
    )
      throw new BadRequestException({
        code: "INVALID_FEATURE_FLAG",
        message: "Invalid feature flag configuration.",
      });
    const override: FlagOverride = {
      enabled: input.enabled,
      rolloutPercent,
      reason,
    };
    await this.prisma.$transaction([
      this.prisma.systemMetadata.upsert({
        where: { key: `${metadataPrefix}${key}` },
        update: { value: JSON.stringify(override) },
        create: {
          key: `${metadataPrefix}${key}`,
          value: JSON.stringify(override),
        },
      }),
      this.prisma.auditLog.create({
        data: { userId: actorId, event: `feature_flag_${key}_updated` },
      }),
    ]);
    this.logger.warn(
      { event: "feature_flag_updated", actorId, key, ...override },
      "Release",
    );
    return this.contract(key, override, actorId);
  }

  async telemetry(
    userId: string,
    eventValue: string,
    propertiesValue: unknown,
  ): Promise<{ accepted: true }> {
    if (!betaTelemetryEvents.includes(eventValue as BetaTelemetryEvent))
      throw new BadRequestException({
        code: "UNKNOWN_TELEMETRY_EVENT",
        message: "Unknown telemetry event.",
      });
    const event = eventValue as BetaTelemetryEvent;
    const properties = this.telemetryProperties(event, propertiesValue);
    await this.prisma.learningEvent.create({
      data: {
        userId,
        name: event,
        properties,
      },
    });
    return { accepted: true };
  }

  async baseline(windowDays = 14): Promise<ProductBaselineResponse> {
    const safeWindow = Number.isFinite(windowDays)
      ? Math.min(90, Math.max(7, Math.round(windowDays)))
      : 14;
    const now = new Date();
    const since = new Date(now.getTime() - safeWindow * 86_400_000);
    const [newUsers, events] = await Promise.all([
      this.prisma.user.findMany({
        where: { createdAt: { gte: since }, role: "learner" },
        select: {
          id: true,
          createdAt: true,
          profile: { select: { onboardingCompletedAt: true } },
        },
      }),
      this.prisma.learningEvent.findMany({
        where: { createdAt: { gte: since }, user: { role: "learner" } },
        select: { userId: true, name: true, createdAt: true },
      }),
    ]);
    const result = calculateProductBaseline({
      newUsers: newUsers.map((user) => ({
        id: user.id,
        createdAt: user.createdAt,
        onboardingCompleted: Boolean(user.profile?.onboardingCompletedAt),
      })),
      events,
    });
    return {
      generatedAt: now.toISOString(),
      windowDays: safeWindow,
      ...result,
      notes: [
        "Wyniki opisują wyłącznie zebrane zdarzenia; brak zdarzenia nie dowodzi braku działania przed wdrożeniem telemetrii.",
        "Treści odpowiedzi, wiadomości, wyszukiwanych słów i dane osobowe nie są zapisywane w telemetrii UX.",
      ],
    };
  }

  async readiness(windowDays = 30): Promise<BetaReadinessResponse> {
    const safeWindow = Number.isFinite(windowDays)
      ? Math.min(90, Math.max(7, Math.round(windowDays)))
      : 30;
    const now = new Date();
    const since = new Date(now.getTime() - safeWindow * 86_400_000);
    const [users, conversationReports, completedConversations, crashMetadata] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { createdAt: { gte: since }, role: "learner" },
          select: {
            id: true,
            createdAt: true,
            profile: { select: { onboardingCompletedAt: true } },
            learningEvents: {
              where: { createdAt: { gte: since } },
              select: { name: true, createdAt: true },
            },
          },
        }),
        this.prisma.conversationReport.count({
          where: { createdAt: { gte: since } },
        }),
        this.prisma.aiConversation.count({
          where: { completedAt: { gte: since } },
        }),
        this.prisma.systemMetadata.findUnique({
          where: { key: "release.crash_free_percent" },
        }),
      ]);
    const parsedCrash = crashMetadata ? Number(crashMetadata.value) : null;
    const metrics = calculateBetaMetrics({
      users: users.map((user) => ({
        id: user.id,
        createdAt: user.createdAt,
        onboardingCompleted: Boolean(user.profile?.onboardingCompletedAt),
        events: user.learningEvents,
      })),
      conversationReports,
      completedConversations,
      crashFreePercent:
        parsedCrash !== null && Number.isFinite(parsedCrash)
          ? parsedCrash
          : null,
      now,
    });
    return {
      generatedAt: now.toISOString(),
      windowDays: safeWindow,
      sampleSize: users.length,
      metrics,
      ...buildReleaseGates(metrics, users.length),
      flags: await this.flags("release-readiness"),
    };
  }

  private async flags(userId: string): Promise<FeatureFlagContract[]> {
    const rows = await this.prisma.systemMetadata.findMany({
      where: { key: { startsWith: metadataPrefix } },
    });
    const overrides = new Map<FeatureFlagKey, FlagOverride>();
    for (const row of rows) {
      try {
        const key = row.key.slice(metadataPrefix.length) as FeatureFlagKey;
        if (featureFlagKeys.includes(key))
          overrides.set(key, JSON.parse(row.value) as FlagOverride);
      } catch {
        this.logger.warn(
          { event: "invalid_feature_flag_metadata", key: row.key },
          "Release",
        );
      }
    }
    return featureFlagKeys.map((key) =>
      this.contract(key, overrides.get(key) ?? this.defaultFlag(key), userId),
    );
  }

  private telemetryProperties(
    event: BetaTelemetryEvent,
    value: unknown,
  ): Record<string, string | number | boolean | null> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const allowed = new Set<string>(betaTelemetryPropertyKeys[event]);
    const properties: Record<string, string | number | boolean | null> = {};
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (!allowed.has(key)) continue;
      if (typeof item === "string") properties[key] = item.slice(0, 80);
      else if (typeof item === "number" && Number.isFinite(item))
        properties[key] = item;
      else if (typeof item === "boolean" || item === null)
        properties[key] = item;
    }
    return properties;
  }

  private contract(
    key: FeatureFlagKey,
    flag: FlagOverride,
    userId: string,
  ): FeatureFlagContract {
    return {
      key,
      enabled: flag.enabled,
      rolloutPercent: flag.rolloutPercent,
      available:
        flag.enabled && featureRolloutBucket(userId, key) < flag.rolloutPercent,
      reason: flag.reason,
    };
  }

  private defaultFlag(key: FeatureFlagKey): FlagOverride {
    if (key === "ai_conversations") {
      const enabled =
        this.environment.APP_ENV !== "production" ||
        Boolean(
          this.environment.GEMINI_API_KEY || this.environment.GROQ_API_KEY,
        );
      return {
        enabled,
        rolloutPercent: enabled ? 100 : 0,
        reason: enabled
          ? "Deterministic development adapter enabled outside production."
          : "Configure a production AI provider to enable conversations.",
      };
    }
    if (key === "listening_lab")
      return {
        enabled: true,
        rolloutPercent: 100,
        reason: "The reviewed listening catalogue is available.",
      };
    if (key === "async_speaking") {
      const enabled =
        this.environment.APP_ENV !== "production" ||
        Boolean(
          this.environment.GEMINI_API_KEY || this.environment.GROQ_API_KEY,
        );
      return {
        enabled,
        rolloutPercent: enabled ? 100 : 0,
        reason: enabled
          ? "Voice transcription is available with privacy and cost controls."
          : "Configure a speech provider to enable voice answers.",
      };
    }
    return {
      enabled: false,
      rolloutPercent: 0,
      reason: "Candidate awaiting beta evidence, cost and privacy review.",
    };
  }

  private channel(): ReleaseConfigResponse["channel"] {
    if (this.environment.APP_ENV === "production") return "production";
    if (this.environment.APP_ENV === "staging") return "staging";
    return "development";
  }
}
