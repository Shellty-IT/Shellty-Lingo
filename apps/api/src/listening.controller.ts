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
import { ListeningService } from "./listening.service";
import { AccessGuard } from "./security.guards";

const bearer = (value?: string): string | undefined =>
  value?.startsWith("Bearer ") ? value.slice(7) : undefined;

@Controller("growth/listening")
@UseGuards(AccessGuard)
export class ListeningController {
  constructor(
    private readonly listening: ListeningService,
    private readonly auth: AuthService,
  ) {}

  @Get("challenges")
  challenges(
    @Query("language") language?: string,
    @Headers("authorization") authorization?: string,
  ) {
    return this.listening.catalog(this.userId(authorization), language);
  }

  @Post("challenges/:id/attempts")
  attempt(
    @Param("id") id: string,
    @Body() body: { optionId?: string; idempotencyKey?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.listening.attempt(this.userId(authorization), id, body);
  }

  private userId(authorization?: string): string {
    return this.auth.verifyAccess(bearer(authorization)).sub;
  }
}
