import {
  createHash,
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
} from "@nestjs/common";
import type {
  AuthUser,
  CourseLanguage,
  InterfaceLocale,
  LoginRequest,
  OnboardingRequest,
  RegisterRequest,
  SessionResponse,
  UpdateProfileRequest,
} from "@shellty/api-contracts";
import type { ApiEnvironment } from "@shellty/config";
import { SignJWT, jwtVerify } from "jose";

import { API_ENVIRONMENT, AppLogger } from "../core/app-logger";
import { PrismaService } from "../core/prisma.service";

export type TokenPayload = { sub: string; role: AuthUser["role"] };
const TOKEN_ISSUER = "shellty-api";
const TOKEN_AUDIENCE = "shellty-clients";
const validCourses = new Set<CourseLanguage>(["en", "th"]);
const validRoles = new Set<AuthUser["role"]>(["learner", "editor", "admin"]);
const scrypt = promisify(scryptCallback);
const hasPrismaCode = (error: unknown, code: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === code;

@Injectable()
export class AuthService {
  private readonly accessSecret: Uint8Array;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
    private readonly logger: AppLogger,
  ) {
    this.accessSecret = new TextEncoder().encode(
      environment.AUTH_ACCESS_TOKEN_SECRET,
    );
  }

  async register(
    input: RegisterRequest,
    ip?: string,
  ): Promise<SessionResponse> {
    const passwordHash = await this.hashPassword(input.password);
    const user = await this.prisma.user
      .create({
        data: {
          email: input.email,
          passwordHash,
          profile: {
            create: { displayName: input.displayName || null },
          },
        },
        include: { profile: true },
      })
      .catch((error: unknown) => {
        if (!hasPrismaCode(error, "P2002")) throw error;
        throw new ConflictException({
          code: "EMAIL_ALREADY_REGISTERED",
          message: "Unable to create account.",
        });
      });
    await this.audit(user.id, "account_registered", ip);
    return this.issue(user);
  }

  async login(input: LoginRequest, ip?: string): Promise<SessionResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { profile: true },
    });
    if (
      !user ||
      !(await this.verifyPassword(user.passwordHash, input.password))
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
    if (!current || current.expiresAt < new Date())
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Session expired.",
      });
    if (current.revokedAt || current.replacedById) {
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
    const refreshToken = randomBytes(48).toString("base64url");
    const now = new Date();
    let session: SessionResponse;
    try {
      session = await this.prisma.$transaction(async (transaction) => {
        const claimed = await transaction.refreshToken.updateMany({
          where: { id: current.id, revokedAt: null, replacedById: null },
          data: { revokedAt: now },
        });
        if (claimed.count !== 1)
          throw new ConflictException({
            code: "REFRESH_TOKEN_REUSED",
            message: "Session expired.",
          });
        const next = await transaction.refreshToken.create({
          data: {
            userId: current.userId,
            familyId: current.familyId,
            tokenHash: this.hash(refreshToken),
            expiresAt: new Date(
              Date.now() +
                this.environment.AUTH_REFRESH_TOKEN_TTL_DAYS * 86400000,
            ),
          },
        });
        await transaction.refreshToken.update({
          where: { id: current.id },
          data: { replacedById: next.id },
        });
        return this.sessionResponse(current.user, refreshToken);
      });
    } catch (error) {
      if (!(error instanceof ConflictException)) throw error;
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
    input: UpdateProfileRequest,
  ): Promise<AuthUser> {
    await this.prisma.userProfile.update({
      where: { userId: id },
      data: {
        displayName: input.displayName,
        ...(input.interfaceLocale
          ? { interfaceLocale: input.interfaceLocale }
          : {}),
        ...(typeof input.notificationsEnabled === "boolean"
          ? { notificationsEnabled: input.notificationsEnabled }
          : {}),
      },
    });
    return this.user(id);
  }
  async completeOnboarding(
    id: string,
    input: OnboardingRequest,
  ): Promise<AuthUser> {
    await this.prisma.$transaction([
      this.prisma.userProfile.update({
        where: { userId: id },
        data: {
          interfaceLocale: input.locale,
          activeCourseLanguage: input.language,
          onboardingCompletedAt: new Date(),
        },
      }),
      this.prisma.userCourse.upsert({
        where: { userId_language: { userId: id, language: input.language } },
        update: {
          learningGoal: input.goal,
          dailyMinutes: input.dailyMinutes,
          timezone: input.timezone,
        },
        create: {
          userId: id,
          language: input.language,
          learningGoal: input.goal,
          dailyMinutes: input.dailyMinutes,
          timezone: input.timezone,
        },
      }),
    ]);
    await this.audit(id, "onboarding_completed");
    return this.user(id);
  }
  async requestExport(id: string): Promise<{ id: string; status: string }> {
    const pending = await this.prisma.dataExportRequest.findFirst({
      where: { userId: id, status: { in: ["pending", "processing"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true },
    });
    if (pending) return pending;
    const result = await this.prisma.dataExportRequest.create({
      data: { userId: id },
      select: { id: true, status: true },
    });
    await this.audit(id, "data_export_requested");
    return result;
  }
  async requestDeletion(
    id: string,
  ): Promise<{ id: string; scheduledFor: string }> {
    const pending = await this.prisma.accountDeletionRequest.findFirst({
      where: { userId: id, status: { in: ["pending", "processing"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, scheduledFor: true },
    });
    if (pending)
      return {
        id: pending.id,
        scheduledFor: pending.scheduledFor.toISOString(),
      };
    const scheduledFor = new Date(Date.now() + 14 * 86400000);
    const result = await this.prisma.accountDeletionRequest.create({
      data: { userId: id, scheduledFor },
    });
    await this.audit(id, "account_deletion_requested");
    return { id: result.id, scheduledFor: scheduledFor.toISOString() };
  }
  async verifyAccess(token?: string): Promise<TokenPayload> {
    if (!token) throw new UnauthorizedException();
    try {
      const { payload } = await jwtVerify(token, this.accessSecret, {
        algorithms: ["HS256"],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      });
      const role = payload["role"];
      if (
        typeof payload.sub !== "string" ||
        !validRoles.has(role as AuthUser["role"])
      )
        throw new Error();
      return { sub: payload.sub, role: role as AuthUser["role"] };
    } catch {
      throw new UnauthorizedException();
    }
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
        activeCourseLanguage: string | null;
        onboardingCompletedAt: Date | null;
      } | null;
    },
    familyId?: string,
  ): Promise<SessionResponse> {
    const refreshToken = randomBytes(48).toString("base64url");
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId: familyId ?? randomUUID(),
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(
          Date.now() + this.environment.AUTH_REFRESH_TOKEN_TTL_DAYS * 86400000,
        ),
      },
    });
    return this.sessionResponse(user, refreshToken);
  }
  private async sessionResponse(
    user: {
      id: string;
      email: string;
      role: AuthUser["role"];
      emailVerifiedAt: Date | null;
      profile: {
        displayName: string | null;
        interfaceLocale: string;
        activeCourseLanguage: string | null;
        onboardingCompletedAt: Date | null;
      } | null;
    },
    refreshToken: string,
  ): Promise<SessionResponse> {
    const accessToken = await new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(user.id)
      .setIssuedAt()
      .setIssuer(TOKEN_ISSUER)
      .setAudience(TOKEN_AUDIENCE)
      .setExpirationTime(`${this.environment.AUTH_ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.accessSecret);
    return {
      accessToken,
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
      activeCourseLanguage: string | null;
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
        activeCourseLanguage: validCourses.has(
          user.profile?.activeCourseLanguage as CourseLanguage,
        )
          ? (user.profile?.activeCourseLanguage as CourseLanguage)
          : null,
        onboardingCompleted: Boolean(user.profile?.onboardingCompletedAt),
      },
    };
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
