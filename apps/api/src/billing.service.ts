import { createHash } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type {
  BillingCatalogResponse,
  BillingStore,
  PlanAccessResponse,
  SubscriptionStatus,
} from "@shellty/api-contracts";
import type { ApiEnvironment } from "@shellty/config";
import { API_ENVIRONMENT } from "./app-logger";
import {
  safeEqual,
  verifySandboxReceipt,
  webhookSignature,
} from "./billing-engine";
import { PrismaService } from "./prisma.service";

const stores = new Set<BillingStore>(["apple", "google"]);
const activeStatuses = new Set<SubscriptionStatus>(["active", "grace_period"]);
const webhookStatuses = new Set<SubscriptionStatus>([
  "active",
  "grace_period",
  "expired",
  "refunded",
  "cancelled",
]);

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
  ) {}

  async catalog(userId: string): Promise<BillingCatalogResponse> {
    return {
      products: [
        {
          id: "shellty_premium_monthly",
          title: "Shellty Premium",
          period: "month",
          displayPrice: "29,99 zł",
          trialDays: 7,
        },
        {
          id: "shellty_premium_annual",
          title: "Shellty Premium",
          period: "year",
          displayPrice: "249,99 zł",
          trialDays: 7,
        },
      ],
      access: await this.access(userId),
    };
  }

  async access(userId: string): Promise<PlanAccessResponse> {
    const now = new Date();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const [subscription, usage] = await Promise.all([
      this.prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ["active", "grace_period"] },
          currentPeriodEnd: { gt: now },
        },
        orderBy: { currentPeriodEnd: "desc" },
      }),
      this.prisma.aiConversationMessage.count({
        where: {
          role: "learner",
          createdAt: { gte: today },
          conversation: { userCourse: { userId } },
        },
      }),
    ]);
    const premium = Boolean(
      subscription && activeStatuses.has(subscription.status),
    );
    return {
      plan: premium ? "premium" : "free",
      status: subscription?.status ?? "none",
      renewsAt: subscription?.currentPeriodEnd.toISOString() ?? null,
      store: subscription?.store ?? null,
      entitlements: premium
        ? ["premium_lessons", "extended_ai", "advanced_progress"]
        : ["starter_lessons", "basic_ai"],
      limits: {
        aiMessagesPerDay: premium ? 100 : 5,
        aiMessagesUsedToday: usage,
        premiumLessons: premium,
      },
    };
  }

  async assertAiMessageAllowed(userId: string): Promise<void> {
    const access = await this.access(userId);
    if (access.limits.aiMessagesUsedToday >= access.limits.aiMessagesPerDay)
      throw new HttpException(
        {
          code: "PLAN_LIMIT_REACHED",
          message: "Daily AI message limit reached.",
          access,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  async assertPremiumContentAllowed(userId: string): Promise<void> {
    if (!(await this.access(userId)).limits.premiumLessons)
      throw new HttpException(
        {
          code: "PREMIUM_REQUIRED",
          message: "This lesson requires Shellty Premium.",
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
  }

  async verifyPurchase(
    userId: string,
    input: {
      store?: string;
      productId?: string;
      transactionId?: string;
      receipt?: string;
    },
  ): Promise<PlanAccessResponse> {
    if (
      !stores.has(input.store as BillingStore) ||
      !input.productId ||
      !input.transactionId ||
      !input.receipt
    )
      throw new BadRequestException("Incomplete purchase.");
    if (!this.environment.BILLING_SANDBOX_ENABLED)
      throw new ServiceUnavailableException(
        "Production store verification adapter is not configured.",
      );
    const verified = verifySandboxReceipt({
      store: input.store as BillingStore,
      productId: input.productId,
      transactionId: input.transactionId,
      receipt: input.receipt,
    });
    if (!verified)
      throw new ForbiddenException("Purchase verification failed.");
    const previous = await this.prisma.subscription.findUnique({
      where: {
        store_originalTransactionId: {
          store: verified.store,
          originalTransactionId: verified.transactionId,
        },
      },
    });
    if (previous && previous.userId !== userId)
      throw new ConflictException(
        "Transaction is assigned to another account.",
      );
    const subscription = await this.prisma.subscription.upsert({
      where: {
        store_originalTransactionId: {
          store: verified.store,
          originalTransactionId: verified.transactionId,
        },
      },
      update: {
        productId: verified.productId,
        status: verified.status,
        currentPeriodEnd: verified.periodEnd,
      },
      create: {
        userId,
        store: verified.store,
        productId: verified.productId,
        originalTransactionId: verified.transactionId,
        status: verified.status,
        currentPeriodEnd: verified.periodEnd,
        environment: verified.environment,
      },
    });
    await this.syncEntitlement(
      userId,
      activeStatuses.has(subscription.status),
      subscription.currentPeriodEnd,
      `${subscription.store}:${subscription.id}`,
    );
    await this.prisma.auditLog.create({
      data: { userId, event: "purchase_verified" },
    });
    return this.access(userId);
  }

  async restore(userId: string): Promise<PlanAccessResponse> {
    const access = await this.access(userId);
    await this.prisma.auditLog.create({
      data: { userId, event: "purchases_restored" },
    });
    return access;
  }

  async webhook(
    storeValue: string,
    signature: string | undefined,
    event: {
      id?: string;
      type?: string;
      originalTransactionId?: string;
      status?: string;
      periodEnd?: string;
      autoRenewing?: boolean;
    },
  ) {
    if (!stores.has(storeValue as BillingStore))
      throw new BadRequestException("Unknown billing store.");
    const expected = webhookSignature(
      this.environment.BILLING_WEBHOOK_SECRET,
      event,
    );
    if (!signature || !safeEqual(signature, expected))
      throw new ForbiddenException("Invalid webhook signature.");
    if (
      !event.id ||
      !event.type ||
      !event.originalTransactionId ||
      !webhookStatuses.has(event.status as SubscriptionStatus) ||
      !event.periodEnd
    )
      throw new BadRequestException("Invalid billing event.");
    const store = storeValue as BillingStore;
    const duplicate = await this.prisma.billingEvent.findUnique({
      where: { store_externalId: { store, externalId: event.id } },
    });
    if (duplicate) return { accepted: true, duplicate: true };
    const periodEnd = new Date(event.periodEnd);
    if (!Number.isFinite(periodEnd.getTime()))
      throw new BadRequestException("Invalid billing period.");
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        store_originalTransactionId: {
          store,
          originalTransactionId: event.originalTransactionId,
        },
      },
    });
    const payloadHash = createHash("sha256")
      .update(JSON.stringify(event))
      .digest("hex");
    if (!subscription) {
      await this.prisma.billingEvent.create({
        data: {
          store,
          externalId: event.id,
          eventType: event.type,
          payloadHash,
          status: "rejected",
          processedAt: new Date(),
        },
      });
      throw new BadRequestException("Unknown original transaction.");
    }
    const status = event.status as SubscriptionStatus;
    await this.prisma.$transaction([
      this.prisma.billingEvent.create({
        data: {
          store,
          externalId: event.id,
          eventType: event.type,
          payloadHash,
          status: "processed",
          processedAt: new Date(),
        },
      }),
      this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status,
          currentPeriodEnd: periodEnd,
          autoRenewing: event.autoRenewing ?? false,
        },
      }),
      this.prisma.entitlement.upsert({
        where: {
          userId_key: { userId: subscription.userId, key: "premium" },
        },
        update: {
          active: activeStatuses.has(status),
          expiresAt: periodEnd,
          source: `${store}:${subscription.id}`,
        },
        create: {
          userId: subscription.userId,
          key: "premium",
          active: activeStatuses.has(status),
          expiresAt: periodEnd,
          source: `${store}:${subscription.id}`,
        },
      }),
    ]);
    return { accepted: true, duplicate: false };
  }

  private async syncEntitlement(
    userId: string,
    active: boolean,
    expiresAt: Date,
    source: string,
  ) {
    await this.prisma.entitlement.upsert({
      where: { userId_key: { userId, key: "premium" } },
      update: { active, expiresAt, source },
      create: { userId, key: "premium", active, expiresAt, source },
    });
  }
}
