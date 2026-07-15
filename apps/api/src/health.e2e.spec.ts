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
    const builder = Test.createTestingModule({ imports: [AppModule] });
    if (process.env.RUN_DATABASE_E2E !== "true")
      builder
        .overrideProvider(PrismaService)
        .useValue({ checkConnection: vi.fn().mockResolvedValue(undefined) });
    const module = await builder.compile();

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

  it("queries database readiness through the application boundary", async () => {
    const response = await request(app.getHttpServer() as Server)
      .get("/v1/health/ready")
      .expect(200);
    expect(response.body).toMatchObject({
      status: "ok",
      database: "connected",
    });
  });
});
