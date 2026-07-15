import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GrowthService } from "./growth.service";
import { AccessGuard } from "./security.guards";

const bearer = (value?: string): string | undefined =>
  value?.startsWith("Bearer ") ? value.slice(7) : undefined;

@Controller("growth")
@UseGuards(AccessGuard)
export class GrowthController {
  constructor(
    private readonly growth: GrowthService,
    private readonly auth: AuthService,
  ) {}

  @Get("today")
  today(
    @Query("language") language: string | undefined,
    @Query("locale") locale: string | undefined,
    @Headers("authorization") authorization?: string,
  ) {
    return this.growth.today(this.userId(authorization), language, locale);
  }

  @Get("progress")
  progress(
    @Query("language") language: string | undefined,
    @Query("locale") locale: string | undefined,
    @Headers("authorization") authorization?: string,
  ) {
    return this.growth.progress(this.userId(authorization), language, locale);
  }

  @Get("thai/path")
  thaiPath(@Headers("authorization") authorization?: string) {
    return this.growth.thaiPath(this.userId(authorization));
  }

  @Patch("thai/transliteration")
  transliteration(
    @Body() body: { enabled?: boolean },
    @Headers("authorization") authorization?: string,
  ) {
    return this.growth.setTransliteration(
      this.userId(authorization),
      body.enabled !== false,
    );
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
    @Headers("authorization") authorization?: string,
  ) {
    return this.growth.startConversation(this.userId(authorization), body);
  }

  @Get("conversations/:id")
  conversation(
    @Param("id") id: string,
    @Headers("authorization") authorization?: string,
  ) {
    return this.growth.conversation(this.userId(authorization), id);
  }

  @Post("conversations/:id/messages")
  message(
    @Param("id") id: string,
    @Body() body: { text?: string; idempotencyKey?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.growth.sendMessage(this.userId(authorization), id, body);
  }

  @Post("conversations/:id/complete")
  complete(
    @Param("id") id: string,
    @Body() body: { locale?: string } = {},
    @Headers("authorization") authorization?: string,
  ) {
    return this.growth.completeConversation(
      this.userId(authorization),
      id,
      body.locale,
    );
  }

  @Post("conversations/:id/reports")
  report(
    @Param("id") id: string,
    @Body() body: { reason?: string; details?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.growth.reportConversation(this.userId(authorization), id, body);
  }

  private userId(authorization?: string): string {
    return this.auth.verifyAccess(bearer(authorization)).sub;
  }
}
