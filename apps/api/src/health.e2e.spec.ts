import type { Server } from "node:http";

import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { CORRELATION_ID_HEADER } from "@shellty/api-contracts";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppModule } from "./app.module";
import { PrismaService } from "./prisma.service";

process.env.DATABASE_URL ??=
  "postgresql://shellty:test@localhost:5432/shellty_lingo_test?schema=public";

describe("health endpoints", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ checkConnection: vi.fn().mockResolvedValue(undefined) })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix("v1");
    await app.init();
  });

  afterEach(async () => app?.close());

  it("returns liveness and propagates a safe correlation id", async () => {
    const response = await request(app.getHttpServer() as Server)
      .get("/v1/health/live")
      .set(CORRELATION_ID_HEADER, "foundation-e2e-request")
      .expect(200);

    expect(response.headers[CORRELATION_ID_HEADER]).toBe(
      "foundation-e2e-request",
    );
    expect(response.body).toMatchObject({
      service: "shellty-lingo-api",
      status: "ok",
      correlationId: "foundation-e2e-request",
    });
  });

  it("queries PostgreSQL readiness through the repository boundary", async () => {
    const response = await request(app.getHttpServer() as Server)
      .get("/v1/health/ready")
      .expect(200);
    expect(response.body).toMatchObject({
      status: "ok",
      database: "connected",
    });
  });
});
