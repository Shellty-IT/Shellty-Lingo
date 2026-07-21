import { Module } from "@nestjs/common";

import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { DictionaryService } from "./dictionary.service";
import { LearningController } from "./learning.controller";
import { LearningContext } from "./learning-support";
import { LessonSessionService } from "./lesson-session.service";
import { PlacementService } from "./placement.service";
import { ReviewService } from "./review.service";

@Module({
  imports: [AuthModule, BillingModule, AiModule],
  controllers: [LearningController],
  providers: [
    LearningContext,
    PlacementService,
    LessonSessionService,
    DictionaryService,
    ReviewService,
  ],
})
export class LearningModule {}
