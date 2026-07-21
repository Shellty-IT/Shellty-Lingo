import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { TokenPayload } from "../auth/auth.service";
import { GrowthService } from "./growth.service";
import { AccessGuard, CurrentUser } from "../auth/security.guards";

@ApiTags("growth")
@Controller("growth")
@UseGuards(AccessGuard)
export class GrowthController {
  constructor(private readonly growth: GrowthService) {}

  @Get("today")
  today(
    @Query("language") language: string | undefined,
    @Query("locale") locale: string | undefined,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.growth.today(user.sub, language, locale);
  }

  @Get("progress")
  progress(
    @Query("language") language: string | undefined,
    @Query("locale") locale: string | undefined,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.growth.progress(user.sub, language, locale);
  }

  @Get("thai/path")
  thaiPath(@CurrentUser() user: TokenPayload) {
    return this.growth.thaiPath(user.sub);
  }

  @Patch("thai/transliteration")
  transliteration(
    @Body() body: { enabled?: boolean },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.growth.setTransliteration(user.sub, body.enabled !== false);
  }

  @Get("conversations/scenarios")
  scenarios(@Query("language") language: string | undefined) {
    return this.growth.listScenarios(language);
  }

  @Post("conversations")
  startConversation(
    @Body()
    body: {
      language?: string;
      scenarioId?: string;
      correctionMode?: string;
      idempotencyKey?: string;
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.growth.startConversation(user.sub, body);
  }

  @Get("conversations/:id")
  conversation(@Param("id") id: string, @CurrentUser() user: TokenPayload) {
    return this.growth.conversation(user.sub, id);
  }

  @Post("conversations/:id/messages")
  message(
    @Param("id") id: string,
    @Body() body: { text?: string; idempotencyKey?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.growth.sendMessage(user.sub, id, body);
  }

  @Post("conversations/:id/complete")
  complete(
    @Param("id") id: string,
    @CurrentUser() user: TokenPayload,
    @Body() body: { locale?: string } = {},
  ) {
    return this.growth.completeConversation(user.sub, id, body.locale);
  }

  @Post("conversations/:id/reports")
  report(
    @Param("id") id: string,
    @Body() body: { reason?: string; details?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.growth.reportConversation(user.sub, id, body);
  }
}
