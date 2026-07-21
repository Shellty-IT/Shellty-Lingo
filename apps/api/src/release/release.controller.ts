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
import { ReleaseService } from "./release.service";
import {
  AccessGuard,
  CurrentUser,
  RequireRole,
  RolesGuard,
} from "../auth/security.guards";

@ApiTags("release")
@Controller("release")
@UseGuards(AccessGuard, RolesGuard)
export class ReleaseController {
  constructor(private readonly release: ReleaseService) {}

  @Get("config")
  config(@CurrentUser() user: TokenPayload) {
    return this.release.config(user.sub);
  }

  @Post("telemetry")
  telemetry(
    @Body() body: { event?: string; properties?: unknown },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.release.telemetry(user.sub, body.event ?? "", body.properties);
  }

  @Get("readiness")
  @RequireRole("admin")
  readiness(@Query("windowDays") windowDays?: string) {
    return this.release.readiness(Number(windowDays || 30));
  }

  @Patch("flags/:key")
  @RequireRole("admin")
  flag(
    @Param("key") key: string,
    @Body()
    body: { enabled?: boolean; rolloutPercent?: number; reason?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.release.updateFlag(user.sub, key, body);
  }
}
