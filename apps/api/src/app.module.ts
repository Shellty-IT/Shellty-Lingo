import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";

import { AiModule } from "./ai/ai.module";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { ContentModule } from "./content/content.module";
import { CoreModule } from "./core/core.module";
import { CorrelationMiddleware } from "./core/correlation";
import { RequestLoggingMiddleware } from "./core/request-logging";
import { GrowthModule } from "./growth/growth.module";
import { HealthModule } from "./health/health.module";
import { LearningModule } from "./learning/learning.module";
import { ListeningModule } from "./listening/listening.module";
import { OperationsModule } from "./operations/operations.module";
import { ReleaseModule } from "./release/release.module";

@Module({
  imports: [
    CoreModule,
    AiModule,
    AuthModule,
    HealthModule,
    ContentModule,
    LearningModule,
    ListeningModule,
    GrowthModule,
    BillingModule,
    OperationsModule,
    ReleaseModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationMiddleware, RequestLoggingMiddleware)
      .forRoutes("*");
  }
}
