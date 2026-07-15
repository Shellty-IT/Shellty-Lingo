import {
  Inject,
  MiddlewareConsumer,
  Module,
  type NestModule,
} from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { parseApiEnvironment, type ApiEnvironment } from "@shellty/config";

import { API_ENVIRONMENT, AppLogger } from "./app-logger";
import { ApiExceptionFilter } from "./api-exception.filter";
import { CorrelationContext, CorrelationMiddleware } from "./correlation";
import { HealthController } from "./health.controller";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { LearningController } from "./learning.controller";
import { LearningService } from "./learning.service";
import { ListeningController } from "./listening.controller";
import { ListeningService } from "./listening.service";
import { GrowthController } from "./growth.controller";
import { GrowthService } from "./growth.service";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";
import { ReleaseController } from "./release.controller";
import { ReleaseService } from "./release.service";
import { PrismaService } from "./prisma.service";
import { RequestLoggingMiddleware } from "./request-logging";
import { AccessGuard, RateLimitGuard } from "./security.guards";

const environmentProvider = {
  provide: API_ENVIRONMENT,
  useFactory: (): ApiEnvironment => parseApiEnvironment(process.env),
};

@Module({
  controllers: [
    HealthController,
    AuthController,
    ContentController,
    LearningController,
    ListeningController,
    GrowthController,
    BillingController,
    OperationsController,
    ReleaseController,
  ],
  providers: [
    environmentProvider,
    CorrelationContext,
    CorrelationMiddleware,
    RequestLoggingMiddleware,
    AuthService,
    ContentService,
    LearningService,
    ListeningService,
    GrowthService,
    BillingService,
    OperationsService,
    ReleaseService,
    AccessGuard,
    RateLimitGuard,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
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
    {
      provide: "ApiEnvironment",
      useFactory: (environment: ApiEnvironment) => environment,
      inject: [API_ENVIRONMENT],
    },
  ],
  exports: [API_ENVIRONMENT, AppLogger, CorrelationContext],
})
export class AppModule implements NestModule {
  constructor(
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    void this.environment;
    consumer
      .apply(CorrelationMiddleware, RequestLoggingMiddleware)
      .forRoutes("*");
  }
}
