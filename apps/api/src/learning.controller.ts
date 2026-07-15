import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { AuthService } from "./auth.service";
import { LearningService } from "./learning.service";
import { AccessGuard } from "./security.guards";

const bearer = (value?: string): string | undefined =>
  value?.startsWith("Bearer ") ? value.slice(7) : undefined;

@Controller("learning")
@UseGuards(AccessGuard)
export class LearningController {
  constructor(
    private readonly learning: LearningService,
    private readonly auth: AuthService,
  ) {}

  @Get("dashboard")
  dashboard(
    @Query("language") language: string | undefined,
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.dashboard(this.userId(authorization), language);
  }

  @Post("placement/start")
  startPlacement(
    @Body()
    body: {
      language?: string;
      interfaceLocale?: string;
      idempotencyKey?: string;
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.startPlacement(this.userId(authorization), body);
  }

  @Post("placement/:sessionId/submit")
  submitPlacement(
    @Param("sessionId") sessionId: string,
    @Body()
    body: {
      answers?: Array<{ questionId?: string; selectedOptionId?: string }>;
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.submitPlacement(
      this.userId(authorization),
      sessionId,
      body,
    );
  }

  @Post("lessons/:courseSlug/:lessonSlug/start")
  startLesson(
    @Param("courseSlug") courseSlug: string,
    @Param("lessonSlug") lessonSlug: string,
    @Body() body: { idempotencyKey?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.startLesson(
      this.userId(authorization),
      courseSlug,
      lessonSlug,
      body,
    );
  }

  @Post("sessions/:sessionId/attempts")
  answer(
    @Param("sessionId") sessionId: string,
    @Body()
    body: { exerciseId?: string; answer?: unknown; idempotencyKey?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.answer(this.userId(authorization), sessionId, body);
  }

  @Post("sessions/:sessionId/complete")
  complete(
    @Param("sessionId") sessionId: string,
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.completeLesson(this.userId(authorization), sessionId);
  }

  @Post("dictionary")
  dictionary(
    @Body()
    body: { exerciseId?: string; selection?: string; targetLocale?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.dictionary(this.userId(authorization), body);
  }

  @Post("dictionary/save")
  saveDictionary(
    @Body()
    body: {
      exerciseId?: string;
      selection?: string;
      targetLocale?: string;
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.saveDictionaryResult(this.userId(authorization), body);
  }

  @Get("reviews")
  reviews(
    @Query("language") language: string | undefined,
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.reviews(this.userId(authorization), language);
  }

  @Post("reviews/:itemId")
  review(
    @Param("itemId") itemId: string,
    @Body() body: { rating?: string; idempotencyKey?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.learning.review(this.userId(authorization), itemId, body);
  }

  private userId(authorization?: string): string {
    return this.auth.verifyAccess(bearer(authorization)).sub;
  }
}
