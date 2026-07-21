import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { AuthService } from "./auth.service";

const environment = {
  AUTH_ACCESS_TOKEN_SECRET: "access-secret-that-is-long-enough-for-tests",
  AUTH_REFRESH_TOKEN_SECRET: "refresh-secret-that-is-long-enough-for-tests",
  AUTH_ACCESS_TOKEN_TTL_SECONDS: 900,
  AUTH_REFRESH_TOKEN_TTL_DAYS: 30,
};

const user = {
  id: "3f8a341b-f3af-40e1-b236-4aa3224dece1",
  email: "learner@example.com",
  role: "learner" as const,
  emailVerifiedAt: null,
  profile: {
    displayName: "Learner",
    interfaceLocale: "pl",
    activeCourseLanguage: "en",
    onboardingCompletedAt: new Date(),
  },
};

describe("AuthService session security", () => {
  it("rejects malformed access tokens without leaking parser errors", async () => {
    const service = new AuthService(
      {} as never,
      environment as never,
      {} as never,
    );

    await expect(service.verifyAccess("not-a-jwt")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("issues access tokens that verify back to the same subject and role", async () => {
    const prisma = {
      user: {
        create: vi.fn().mockResolvedValue(user),
      },
      refreshToken: { create: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const service = new AuthService(
      prisma as never,
      environment as never,
      { log: vi.fn() } as never,
    );

    const session = await service.register({
      email: "learner@example.com",
      password: "long-enough-password",
    });
    const payload = await service.verifyAccess(session.accessToken);

    expect(payload).toEqual({ sub: user.id, role: "learner" });
  });

  it("atomically rotates a refresh token and links its replacement", async () => {
    const current = {
      id: "c9b4f40a-613f-48d1-99f5-f123a3b88253",
      userId: user.id,
      familyId: "df912488-ab45-498d-9d9e-91f0391836dd",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedById: null,
      user,
    };
    const transaction = {
      refreshToken: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({
          id: "9c463b54-d758-48e0-92ab-57eda53af0e6",
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue(current),
        updateMany: vi.fn(),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn((callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new AuthService(
      prisma as never,
      environment as never,
      { log: vi.fn() } as never,
    );

    const result = await service.refresh("old-refresh-token");

    expect(result.refreshToken).not.toBe("old-refresh-token");
    const claim = transaction.refreshToken.updateMany.mock.calls[0]?.[0] as
      | undefined
      | {
          where: { id: string; revokedAt: null; replacedById: null };
        };
    expect(claim?.where).toEqual({
      id: current.id,
      revokedAt: null,
      replacedById: null,
    });
    expect(transaction.refreshToken.update).toHaveBeenCalledWith({
      where: { id: current.id },
      data: { replacedById: "9c463b54-d758-48e0-92ab-57eda53af0e6" },
    });
  });

  it("revokes the whole token family when an old token is reused", async () => {
    const prisma = {
      refreshToken: {
        findUnique: vi.fn().mockResolvedValue({
          id: "old",
          userId: user.id,
          familyId: "family",
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: new Date(),
          replacedById: "next",
          user,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const service = new AuthService(
      prisma as never,
      environment as never,
      { log: vi.fn() } as never,
    );

    await expect(service.refresh("reused-token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    const revocation = prisma.refreshToken.updateMany.mock.calls[0]?.[0] as
      | undefined
      | {
          where: { familyId: string };
          data: { revokedAt: unknown };
        };
    expect(revocation?.where).toEqual({ familyId: "family" });
    expect(revocation?.data.revokedAt).toBeInstanceOf(Date);
  });
});
