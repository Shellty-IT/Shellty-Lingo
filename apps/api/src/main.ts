import "dotenv/config";
import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
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
  app.enableShutdownHooks();
  app.enableCors({ origin: environment.CORS_ORIGINS, credentials: false });
  app.setGlobalPrefix("v1");

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
