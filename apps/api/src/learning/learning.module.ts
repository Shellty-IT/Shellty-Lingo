import { Module } from "@nestjs/common";

import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { DictionaryService } from "./dictionary.service";
import { AdvancedExamService } from "./advanced-exam.service";
import { LearningController } from "./learning.controller";
import { LearningContext } from "./learning-support";
import { LessonSessionService } from "./lesson-session.service";
import { PlacementService } from "./placement.service";
import { ReviewService } from "./review.service";
import { LessonAudioService } from "./lesson-audio.service";
import { PracticeService } from "./practice.service";
import { PracticeController } from "./practice.controller";
import { ReleaseModule } from "../release/release.module";

@Module({
  imports: [AuthModule, BillingModule, AiModule, ReleaseModule],
  controllers: [LearningController, PracticeController],
  providers: [
    LearningContext,
    AdvancedExamService,
    PlacementService,
    LessonSessionService,
    DictionaryService,
    ReviewService,
    LessonAudioService,
    PracticeService,
  ],
})
export class LearningModule {}
