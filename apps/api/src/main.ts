import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { RequestMethod } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { parseApiEnvironment } from "@shellty/config";

import { AppLogger } from "./app-logger";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const environment = parseApiEnvironment(process.env);

  if (environment.SENTRY_DSN) {
    Sentry.init({
      dsn: environment.SENTRY_DSN,
      environment: environment.APP_ENV,
      release: environment.APP_VERSION,
      sendDefaultPii: false,
      tracesSampleRate: environment.APP_ENV === "production" ? 0.1 : 0,
      beforeSend(event) {
        delete event.request;
        delete event.user;
        return event;
      },
    });
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  const expressApplication = app.getHttpAdapter().getInstance() as {
    disable(name: string): void;
    set(name: string, value: unknown): void;
  };
  expressApplication.disable("x-powered-by");
  if (environment.APP_ENV === "staging" || environment.APP_ENV === "production")
    expressApplication.set("trust proxy", 1);
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    if (environment.APP_ENV === "production")
      response.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    next();
  });
  app.enableShutdownHooks();
  app.enableCors({
    origin: environment.CORS_ORIGINS,
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "authorization",
      "content-type",
      "x-correlation-id",
      "x-shellty-signature",
    ],
  });
  app.setGlobalPrefix("v1", {
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });

  await app.listen(environment.API_PORT, environment.API_HOST);
  logger.log(
    { host: environment.API_HOST, port: environment.API_PORT },
    "Bootstrap",
  );
}

void bootstrap().catch((error: unknown) => {
  Sentry.captureException(error);
  console.error("API bootstrap failed", error);
  process.exitCode = 1;
});
