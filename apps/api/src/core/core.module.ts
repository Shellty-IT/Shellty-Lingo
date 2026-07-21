import { Global, Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { parseApiEnvironment, type ApiEnvironment } from "@shellty/config";

import { API_ENVIRONMENT, AppLogger } from "./app-logger";
import { ApiExceptionFilter } from "./api-exception.filter";
import { CorrelationContext, CorrelationMiddleware } from "./correlation";
import { CourseStructureCache } from "./course-structure-cache";
import { PrismaService } from "./prisma.service";
import { RequestLoggingMiddleware } from "./request-logging";

/**
 * Global infrastructure: environment, structured logging, correlation, Prisma,
 * the API-wide exception filter and rate-limit storage. Feature modules
 * receive these without importing CoreModule explicitly.
 *
 * ThrottlerModule's default in-memory storage is per-process, which is
 * correct for the current single-instance deployment (render.yaml). If a
 * second instance is ever added, pass a `storage` option here backed by
 * Redis (e.g. `@nest-lab/throttler-storage-redis`) — no guard or controller
 * code needs to change.
 */
@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 10 }]),
  ],
  providers: [
    {
      provide: API_ENVIRONMENT,
      useFactory: (): ApiEnvironment => parseApiEnvironment(process.env),
    },
    CorrelationContext,
    CorrelationMiddleware,
    RequestLoggingMiddleware,
    {
      provide: AppLogger,
      useFactory: (
        correlation: CorrelationContext,
        environment: ApiEnvironment,
      ) => new AppLogger(correlation, environment),
      inject: [CorrelationContext, API_ENVIRONMENT],
    },
    {
      provide: PrismaService,
      useFactory: (environment: ApiEnvironment) =>
        new PrismaService(environment),
      inject: [API_ENVIRONMENT],
    },
    CourseStructureCache,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
  exports: [
    API_ENVIRONMENT,
    AppLogger,
    CorrelationContext,
    CorrelationMiddleware,
    RequestLoggingMiddleware,
    PrismaService,
    CourseStructureCache,
  ],
})
export class CoreModule {}
