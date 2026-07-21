import type { Server } from "node:http";
import { randomUUID } from "node:crypto";

import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { SessionResponse } from "@shellty/api-contracts";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../app.module";
import { PrismaService } from "../core/prisma.service";

const databaseDescribe =
  process.env.RUN_DATABASE_E2E === "true" ? describe : describe.skip;

databaseDescribe("authentication database flow", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-${randomUUID()}@example.test`;
  const password = "E2e-password-that-is-long-enough";

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("v1");
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email } });
    await app?.close();
  });

  it("registers, configures a course and detects refresh-token reuse", async () => {
    const registration = await request(app.getHttpServer() as Server)
      .post("/v1/auth/register")
      .send({ email, password, displayName: "E2E Learner" })
      .expect(201);
    const first = registration.body as unknown as SessionResponse;

    const onboarding = await request(app.getHttpServer() as Server)
      .post("/v1/auth/onboarding")
      .set("authorization", `Bearer ${first.accessToken}`)
      .send({
        locale: "pl",
        language: "en",
        goal: "work",
        dailyMinutes: 15,
        timezone: "Europe/Warsaw",
      })
      .expect(201);
    const onboardingBody = onboarding.body as unknown as {
      profile?: {
        activeCourseLanguage?: unknown;
        onboardingCompleted?: unknown;
      };
    };
    expect(onboardingBody.profile).toMatchObject({
      activeCourseLanguage: "en",
      onboardingCompleted: true,
    });

    const refresh = await request(app.getHttpServer() as Server)
      .post("/v1/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(201);
    const rotated = refresh.body as unknown as SessionResponse;
    expect(rotated.refreshToken).not.toBe(first.refreshToken);

    const reuse = await request(app.getHttpServer() as Server)
      .post("/v1/auth/refresh")
      .send({ refreshToken: first.refreshToken })
      .expect(401);
    const reuseBody = reuse.body as unknown as {
      error?: { code?: unknown; correlationId?: unknown };
    };
    expect(reuseBody.error?.code).toBe("SESSION_REVOKED");
    expect(typeof reuseBody.error?.correlationId).toBe("string");

    await request(app.getHttpServer() as Server)
      .post("/v1/auth/refresh")
      .send({ refreshToken: rotated.refreshToken })
      .expect(401);
  });
});
