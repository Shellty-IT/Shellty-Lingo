import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  NotificationKind,
  NotificationPreferenceContract,
  PrivacySettingsResponse,
} from "@shellty/api-contracts";
import { AppLogger } from "../core/app-logger";
import {
  isValidTime,
  isValidTimezone,
  shouldQueueNotification,
} from "./operations-engine";
import { PrismaService } from "../core/prisma.service";

const kinds: NotificationKind[] = [
  "learning_reminder",
  "review_due",
  "product_updates",
];
const policyVersion = "2026-07-15";

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async privacySettings(userId: string): Promise<PrivacySettingsResponse> {
    const preferences = await this.ensurePreferences(userId);
    return {
      policyVersion,
      termsVersion: policyVersion,
      conversationRetentionDays: 30,
      diagnosticLogRetentionDays: 30,
      exportLinkRetentionHours: 24,
      preferences: preferences.map((item) => this.contract(item)),
    };
  }

  async updatePreference(
    userId: string,
    input: {
      kind?: string;
      enabled?: boolean;
      localTime?: string;
      timezone?: string;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    },
  ): Promise<NotificationPreferenceContract> {
    if (!kinds.includes(input.kind as NotificationKind))
      throw new BadRequestException("Unknown notification type.");
    const timezone = input.timezone ?? "UTC";
    const localTime = input.localTime ?? "19:00";
    const quietHoursStart = input.quietHoursStart ?? "22:00";
    const quietHoursEnd = input.quietHoursEnd ?? "07:00";
    if (
      !isValidTimezone(timezone) ||
      ![localTime, quietHoursStart, quietHoursEnd].every(isValidTime)
    )
      throw new BadRequestException("Invalid timezone or local time.");
    const kind = input.kind as NotificationKind;
    const enabled = input.enabled === true;
    const [preference] = await this.prisma.$transaction([
      this.prisma.notificationPreference.upsert({
        where: { userId_kind: { userId, kind } },
        update: {
          enabled,
          localTime,
          timezone,
          quietHoursStart,
          quietHoursEnd,
        },
        create: {
          userId,
          kind,
          enabled,
          localTime,
          timezone,
          quietHoursStart,
          quietHoursEnd,
        },
      }),
      this.prisma.consent.create({
        data: {
          userId,
          key: `notification:${kind}`,
          granted: enabled,
          version: policyVersion,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          event: enabled
            ? `notification_${kind}_enabled`
            : `notification_${kind}_disabled`,
        },
      }),
    ]);
    return this.contract(preference);
  }

  async support(
    userId: string,
    input: { category?: string; subject?: string; message?: string },
  ) {
    const category = input.category?.trim();
    const subject = input.subject?.trim();
    const message = input.message?.trim();
    if (!category || !subject || !message || message.length > 5000)
      throw new BadRequestException("Complete the support request.");
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        category: category.slice(0, 50),
        subject: subject.slice(0, 160),
        message,
      },
      select: { id: true, status: true, createdAt: true },
    });
    await this.prisma.auditLog.create({
      data: { userId, event: "support_ticket_created" },
    });
    return ticket;
  }

  async queueDueNotifications(now = new Date()): Promise<{ queued: number }> {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { enabled: true },
    });
    let queued = 0;
    for (const preference of preferences) {
      const decision = shouldQueueNotification(now, preference);
      if (!decision.queue) continue;
      const idempotencyKey = `${preference.userId}:${preference.kind}:${decision.localDate}`;
      const exists = await this.prisma.notificationDelivery.findUnique({
        where: { idempotencyKey },
      });
      if (exists) continue;
      await this.prisma.notificationDelivery.create({
        data: {
          userId: preference.userId,
          preferenceId: preference.id,
          idempotencyKey,
          scheduledAt: now,
        },
      });
      queued += 1;
    }
    this.logger.log({ event: "notifications_queued", queued }, "Operations");
    return { queued };
  }

  async runRetention(now = new Date()) {
    const before = (days: number) => new Date(now.getTime() - days * 86400000);
    const [conversations, logs, exports, deliveries] =
      await this.prisma.$transaction([
        this.prisma.aiConversation.deleteMany({
          where: { completedAt: { lt: before(30) } },
        }),
        this.prisma.auditLog.deleteMany({
          where: { createdAt: { lt: before(365) } },
        }),
        this.prisma.dataExportRequest.deleteMany({
          where: { status: "completed", createdAt: { lt: before(7) } },
        }),
        this.prisma.notificationDelivery.deleteMany({
          where: { createdAt: { lt: before(90) } },
        }),
      ]);
    const result = {
      conversations: conversations.count,
      auditLogs: logs.count,
      exports: exports.count,
      notificationDeliveries: deliveries.count,
    };
    this.logger.log({ event: "retention_completed", ...result }, "Operations");
    return result;
  }

  private async ensurePreferences(userId: string) {
    await this.prisma.$transaction(
      kinds.map((kind) =>
        this.prisma.notificationPreference.upsert({
          where: { userId_kind: { userId, kind } },
          update: {},
          create: { userId, kind },
        }),
      ),
    );
    return this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { kind: "asc" },
    });
  }

  private contract(preference: {
    kind: NotificationKind;
    enabled: boolean;
    localTime: string;
    timezone: string;
    quietHoursStart: string;
    quietHoursEnd: string;
  }): NotificationPreferenceContract {
    return {
      kind: preference.kind,
      enabled: preference.enabled,
      localTime: preference.localTime,
      timezone: preference.timezone,
      quietHours: {
        start: preference.quietHoursStart,
        end: preference.quietHoursEnd,
      },
    };
  }
}
