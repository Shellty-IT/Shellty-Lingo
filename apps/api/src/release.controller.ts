import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ReleaseService } from "./release.service";
import { AccessGuard } from "./security.guards";

const bearer = (value?: string): string | undefined =>
  value?.startsWith("Bearer ") ? value.slice(7) : undefined;

@Controller("release")
@UseGuards(AccessGuard)
export class ReleaseController {
  constructor(
    private readonly release: ReleaseService,
    private readonly auth: AuthService,
  ) {}

  @Get("config")
  config(@Headers("authorization") authorization?: string) {
    return this.release.config(this.user(authorization).sub);
  }

  @Post("telemetry")
  telemetry(
    @Body() body: { event?: string; properties?: unknown },
    @Headers("authorization") authorization?: string,
  ) {
    return this.release.telemetry(
      this.user(authorization).sub,
      body.event ?? "",
      body.properties,
    );
  }

  @Get("readiness")
  readiness(
    @Query("windowDays") windowDays?: string,
    @Headers("authorization") authorization?: string,
  ) {
    this.requireAdmin(authorization);
    return this.release.readiness(Number(windowDays || 30));
  }

  @Patch("flags/:key")
  flag(
    @Param("key") key: string,
    @Body()
    body: { enabled?: boolean; rolloutPercent?: number; reason?: string },
    @Headers("authorization") authorization?: string,
  ) {
    const actor = this.requireAdmin(authorization);
    return this.release.updateFlag(actor.sub, key, body);
  }

  private user(authorization?: string) {
    return this.auth.verifyAccess(bearer(authorization));
  }

  private requireAdmin(authorization?: string) {
    const user = this.user(authorization);
    if (user.role !== "admin") throw new ForbiddenException();
    return user;
  }
}
