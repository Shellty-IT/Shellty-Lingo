import {
  Inject,
  MiddlewareConsumer,
  Module,
  type NestModule,
} from "@nestjs/common";
import { parseApiEnvironment, type ApiEnvironment } from "@shellty/config";

import { API_ENVIRONMENT, AppLogger } from "./app-logger";
import { CorrelationContext, CorrelationMiddleware } from "./correlation";
import { HealthController } from "./health.controller";
import { PrismaService } from "./prisma.service";
import { RequestLoggingMiddleware } from "./request-logging";

const environmentProvider = {
  provide: API_ENVIRONMENT,
  useFactory: (): ApiEnvironment => parseApiEnvironment(process.env),
};

@Module({
  controllers: [HealthController],
  providers: [
    environmentProvider,
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
