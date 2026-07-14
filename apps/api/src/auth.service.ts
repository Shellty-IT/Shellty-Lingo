import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import type {
  AuthUser,
  CourseLanguage,
  InterfaceLocale,
  SessionResponse,
} from "@shellty/api-contracts";
import type { ApiEnvironment } from "@shellty/config";

import { API_ENVIRONMENT, AppLogger } from "./app-logger";
import { PrismaService } from "./prisma.service";

type TokenPayload = { sub: string; role: AuthUser["role"]; exp: number };
const validLocales = new Set<InterfaceLocale>(["pl", "en", "th"]);
const validCourses = new Set<CourseLanguage>(["en", "th"]);
const scrypt = promisify(scryptCallback);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
    private readonly logger: AppLogger,
  ) {}

  async register(
    input: { email?: string; password?: string; displayName?: string },
    ip?: string,
  ): Promise<SessionResponse> {
    const email = this.email(input.email);
    const password = this.password(input.password);
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists)
      throw new ConflictException({
        code: "EMAIL_ALREADY_REGISTERED",
        message: "Unable to create account.",
      });
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await this.hashPassword(password),
        profile: {
          create: {
            displayName: input.displayName?.trim().slice(0, 100) || null,
          },
        },
      },
      include: { profile: true },
    });
    await this.audit(user.id, "account_registered", ip);
    return this.issue(user);
  }

  async login(
    input: { email?: string; password?: string },
    ip?: string,
  ): Promise<SessionResponse> {
    const email = this.email(input.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (
      !user ||
      !(await this.verifyPassword(user.passwordHash, input.password ?? ""))
    ) {
      await this.audit(user?.id, "login_failed", ip);
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }
    await this.audit(user.id, "login_succeeded", ip);
    return this.issue(user);
  }

  async refresh(token?: string, ip?: string): Promise<SessionResponse> {
    if (!token)
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Session expired.",
      });
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(token) },
      include: { user: { include: { profile: true } } },
    });
    if (!current || current.revokedAt || current.expiresAt < new Date())
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Session expired.",
      });
    const replacement = await this.prisma.refreshToken.findFirst({
      where: { familyId: current.familyId, replacedById: current.id },
    });
    if (replacement) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: current.familyId },
        data: { revokedAt: new Date() },
      });
      await this.audit(current.userId, "refresh_token_reuse_detected", ip);
      throw new UnauthorizedException({
        code: "SESSION_REVOKED",
        message: "Session expired.",
      });
    }
    const session = await this.issue(current.user, current.familyId);
    const newToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(session.refreshToken) },
    });
    if (newToken)
      await this.prisma.refreshToken.update({
        where: { id: current.id },
        data: { revokedAt: new Date(), replacedById: newToken.id },
      });
    await this.audit(current.userId, "session_refreshed", ip);
    return session;
  }

  async logout(token?: string, ip?: string): Promise<void> {
    if (token) {
      const current = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: this.hash(token) },
      });
      if (current) {
        await this.prisma.refreshToken.updateMany({
          where: { familyId: current.familyId },
          data: { revokedAt: new Date() },
        });
        await this.audit(current.userId, "session_revoked", ip);
      }
    }
  }
  async user(id: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }
  async updateProfile(
    id: string,
    input: {
      displayName?: string;
      interfaceLocale?: string;
      notificationsEnabled?: boolean;
    },
  ): Promise<AuthUser> {
    const locale = input.interfaceLocale;
    if (locale && !validLocales.has(locale as InterfaceLocale))
      throw new BadRequestException({
        code: "INVALID_LOCALE",
        message: "Invalid locale.",
      });
    await this.prisma.userProfile.update({
      where: { userId: id },
      data: {
        displayName: input.displayName?.trim().slice(0, 100),
        ...(locale ? { interfaceLocale: locale } : {}),
        ...(typeof input.notificationsEnabled === "boolean"
          ? { notificationsEnabled: input.notificationsEnabled }
          : {}),
      },
    });
    return this.user(id);
  }
  async completeOnboarding(
    id: string,
    input: {
      locale?: string;
      language?: string;
      goal?: string;
      dailyMinutes?: number;
    },
  ): Promise<AuthUser> {
    if (
      !validLocales.has(input.locale as InterfaceLocale) ||
      !validCourses.has(input.language as CourseLanguage) ||
      !input.goal
    )
      throw new BadRequestException({
        code: "INVALID_ONBOARDING",
        message: "Invalid onboarding data.",
      });
    const dailyMinutes = Math.max(
      5,
      Math.min(120, Math.floor(input.dailyMinutes ?? 15)),
    );
    await this.prisma.$transaction([
      this.prisma.userProfile.update({
        where: { userId: id },
        data: {
          interfaceLocale: input.locale!,
          onboardingCompletedAt: new Date(),
        },
      }),
      this.prisma.userCourse.upsert({
        where: { userId_language: { userId: id, language: input.language! } },
        update: { learningGoal: input.goal, dailyMinutes },
        create: {
          userId: id,
          language: input.language!,
          learningGoal: input.goal,
          dailyMinutes,
        },
      }),
    ]);
    await this.audit(id, "onboarding_completed");
    return this.user(id);
  }
  async requestExport(id: string): Promise<{ id: string; status: string }> {
    const result = await this.prisma.dataExportRequest.create({
      data: { userId: id },
    });
    await this.audit(id, "data_export_requested");
    return result;
  }
  async requestDeletion(
    id: string,
  ): Promise<{ id: string; scheduledFor: string }> {
    const scheduledFor = new Date(Date.now() + 14 * 86400000);
    const result = await this.prisma.accountDeletionRequest.create({
      data: { userId: id, scheduledFor },
    });
    await this.audit(id, "account_deletion_requested");
    return { id: result.id, scheduledFor: scheduledFor.toISOString() };
  }
  verifyAccess(token?: string): TokenPayload {
    if (!token) throw new UnauthorizedException();
    const [header, payload, signature] = token.split(".");
    if (
      !header ||
      !payload ||
      !signature ||
      !this.equals(signature, this.sign(`${header}.${payload}`))
    )
      throw new UnauthorizedException();
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as TokenPayload;
    if (!decoded.sub || decoded.exp <= Math.floor(Date.now() / 1000))
      throw new UnauthorizedException();
    return decoded;
  }
  private async issue(
    user: {
      id: string;
      email: string;
      role: AuthUser["role"];
      emailVerifiedAt: Date | null;
      profile: {
        displayName: string | null;
        interfaceLocale: string;
        onboardingCompletedAt: Date | null;
      } | null;
    },
    familyId?: string,
  ): Promise<SessionResponse> {
    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId: (familyId ?? randomUUID()) as never,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(
          Date.now() + this.environment.AUTH_REFRESH_TOKEN_TTL_DAYS * 86400000,
        ),
      },
    });
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        role: user.role,
        exp:
          Math.floor(Date.now() / 1000) +
          this.environment.AUTH_ACCESS_TOKEN_TTL_SECONDS,
      }),
    ).toString("base64url");
    return {
      accessToken: `${header}.${payload}.${this.sign(`${header}.${payload}`)}`,
      refreshToken,
      user: this.publicUser(user),
    };
  }
  private publicUser(user: {
    id: string;
    email: string;
    role: AuthUser["role"];
    emailVerifiedAt: Date | null;
    profile: {
      displayName: string | null;
      interfaceLocale: string;
      onboardingCompletedAt: Date | null;
    } | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
      role: user.role,
      profile: {
        displayName: user.profile?.displayName ?? null,
        interfaceLocale: (user.profile?.interfaceLocale ??
          "pl") as InterfaceLocale,
        onboardingCompleted: Boolean(user.profile?.onboardingCompletedAt),
      },
    };
  }
  private email(value?: string): string {
    const email = value?.trim().toLowerCase();
    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 320
    )
      throw new BadRequestException({
        code: "INVALID_EMAIL",
        message: "Invalid email.",
      });
    return email;
  }
  private password(value?: string): string {
    if (!value || value.length < 12 || value.length > 128)
      throw new BadRequestException({
        code: "INVALID_PASSWORD",
        message: "Password must contain at least 12 characters.",
      });
    return value;
  }
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
  }
  private async verifyPassword(
    stored: string,
    password: string,
  ): Promise<boolean> {
    const [, saltText, hashText] = stored.split("$");
    if (!saltText || !hashText) return false;
    const hash = (await scrypt(
      password,
      Buffer.from(saltText, "base64url"),
      64,
    )) as Buffer;
    return this.equals(hash.toString("base64url"), hashText);
  }
  private hash(value: string): string {
    return createHash("sha256")
      .update(`${this.environment.AUTH_REFRESH_TOKEN_SECRET}:${value}`)
      .digest("hex");
  }
  private sign(value: string): string {
    return createHmac("sha256", this.environment.AUTH_ACCESS_TOKEN_SECRET)
      .update(value)
      .digest("base64url");
  }
  private equals(a: string, b: string): boolean {
    const aa = Buffer.from(a);
    const bb = Buffer.from(b);
    return aa.length === bb.length && timingSafeEqual(aa, bb);
  }
  private async audit(
    userId: string | undefined,
    event: string,
    ip?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        event,
        ...(ip
          ? { ipHash: createHash("sha256").update(ip).digest("hex") }
          : {}),
      },
    });
    this.logger.log({ event, userId }, "Security");
  }
}
