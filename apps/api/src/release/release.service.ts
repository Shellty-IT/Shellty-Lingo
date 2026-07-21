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
  ReleaseConfigResponse,
} from "@shellty/api-contracts";
import { betaTelemetryEvents, featureFlagKeys } from "@shellty/api-contracts";
import type { ApiEnvironment } from "@shellty/config";
import { API_ENVIRONMENT, AppLogger } from "../core/app-logger";
import {
  buildReleaseGates,
  calculateBetaMetrics,
  featureRolloutBucket,
} from "./release-engine";
import { PrismaService } from "../core/prisma.service";

interface FlagOverride {
  enabled: boolean;
  rolloutPercent: number;
  reason: string;
}

const metadataPrefix = "release.flag.";

@Injectable()
export class ReleaseService {
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
      throw new BadRequestException("Unknown feature flag.");
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
      throw new BadRequestException("Invalid feature flag configuration.");
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
      throw new BadRequestException("Unknown telemetry event.");
    const properties =
      propertiesValue &&
      typeof propertiesValue === "object" &&
      JSON.stringify(propertiesValue).length <= 1000
        ? (propertiesValue as Record<string, string | number | boolean | null>)
        : {};
    await this.prisma.learningEvent.create({
      data: {
        userId,
        name: eventValue,
        properties,
      },
    });
    return { accepted: true };
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
      const enabled = this.environment.APP_ENV !== "production";
      return {
        enabled,
        rolloutPercent: enabled ? 100 : 0,
        reason: enabled
          ? "Deterministic development adapter enabled outside production."
          : "Awaiting a production AI adapter, evaluations and cost alerts.",
      };
    }
    if (key === "listening_lab" || key === "async_speaking") {
      const enabled = this.environment.APP_ENV !== "production";
      return {
        enabled,
        rolloutPercent: enabled ? 100 : 0,
        reason: enabled
          ? "Post-MVP experiment enabled outside production."
          : "Awaiting beta evidence and privacy review.",
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
