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
import { ThrottlerGuard } from "@nestjs/throttler";
import { AccessGuard, CurrentUser } from "../auth/security.guards";
import type { TokenPayload } from "../auth/auth.service";
import { PracticeService } from "./practice.service";
import { ReviewService } from "./review.service";

@ApiTags("learning")
@Controller("learning")
@UseGuards(AccessGuard, ThrottlerGuard)
export class PracticeController {
  constructor(
    private readonly practice: PracticeService,
    private readonly reviews: ReviewService,
  ) {}
  @Get("attempts/:attemptId/correction")
  saved(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.practice.saved(user.sub, attemptId);
  }
  @Get("reviews/batch")
  batch(
    @CurrentUser() user: TokenPayload,
    @Query("language") language?: string,
    @Query("interfaceLocale") locale?: string,
    @Query("size") size?: string,
  ) {
    return this.reviews.batch(user.sub, language, locale, Number(size ?? 5));
  }
  @Post("attempts/:attemptId/correction")
  correct(
    @Param("attemptId") attemptId: string,
    @Body() body: { answer?: string; idempotencyKey?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.practice.correct(user.sub, attemptId, body);
  }
}
