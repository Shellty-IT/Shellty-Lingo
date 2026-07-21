import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { TokenPayload } from "../auth/auth.service";
import { AccessGuard, CurrentUser } from "../auth/security.guards";
import { DictionaryService } from "./dictionary.service";
import { LessonSessionService } from "./lesson-session.service";
import { PlacementService } from "./placement.service";
import { ReviewService } from "./review.service";

@ApiTags("learning")
@Controller("learning")
@UseGuards(AccessGuard)
export class LearningController {
  constructor(
    private readonly placement: PlacementService,
    private readonly lessons: LessonSessionService,
    private readonly dictionaries: DictionaryService,
    private readonly reviewQueue: ReviewService,
  ) {}

  @Get("dashboard")
  dashboard(
    @Query("language") language: string | undefined,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.lessons.dashboard(user.sub, language);
  }

  @Post("placement/start")
  startPlacement(
    @Body()
    body: {
      language?: string;
      interfaceLocale?: string;
      idempotencyKey?: string;
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.placement.startPlacement(user.sub, body);
  }

  @Post("placement/:sessionId/submit")
  submitPlacement(
    @Param("sessionId") sessionId: string,
    @Body()
    body: {
      answers?: Array<{ questionId?: string; selectedOptionId?: string }>;
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.placement.submitPlacement(user.sub, sessionId, body);
  }

  @Post("lessons/:courseSlug/:lessonSlug/start")
  startLesson(
    @Param("courseSlug") courseSlug: string,
    @Param("lessonSlug") lessonSlug: string,
    @Body() body: { idempotencyKey?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.lessons.startLesson(user.sub, courseSlug, lessonSlug, body);
  }

  @Post("sessions/:sessionId/attempts")
  answer(
    @Param("sessionId") sessionId: string,
    @Body()
    body: { exerciseId?: string; answer?: unknown; idempotencyKey?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.lessons.answer(user.sub, sessionId, body);
  }

  @Post("sessions/:sessionId/complete")
  complete(
    @Param("sessionId") sessionId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.lessons.completeLesson(user.sub, sessionId);
  }

  @Post("dictionary")
  dictionary(
    @Body()
    body: { exerciseId?: string; selection?: string; targetLocale?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.dictionaries.dictionary(user.sub, body);
  }

  @Post("dictionary/save")
  saveDictionary(
    @Body()
    body: {
      exerciseId?: string;
      selection?: string;
      targetLocale?: string;
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.dictionaries.saveDictionaryResult(user.sub, body);
  }

  @Get("reviews")
  reviews(
    @Query("language") language: string | undefined,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.reviewQueue.reviews(user.sub, language);
  }

  @Post("reviews/:itemId")
  review(
    @Param("itemId") itemId: string,
    @Body() body: { rating?: string; idempotencyKey?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.reviewQueue.review(user.sub, itemId, body);
  }
}
