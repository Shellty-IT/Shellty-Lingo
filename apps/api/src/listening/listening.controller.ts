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
import { ListeningService } from "./listening.service";
import { AccessGuard, CurrentUser } from "../auth/security.guards";

@ApiTags("listening")
@Controller("growth/listening")
@UseGuards(AccessGuard)
export class ListeningController {
  constructor(private readonly listening: ListeningService) {}

  @Get("challenges")
  challenges(
    @CurrentUser() user: TokenPayload,
    @Query("language") language?: string,
  ) {
    return this.listening.catalog(user.sub, language);
  }

  @Post("challenges/:id/attempts")
  attempt(
    @Param("id") id: string,
    @Body() body: { optionId?: string; idempotencyKey?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.listening.attempt(user.sub, id, body);
  }
}
