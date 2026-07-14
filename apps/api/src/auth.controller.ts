import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import type { SessionResponse } from "@shellty/api-contracts";
import { AuthService } from "./auth.service";
import { AccessGuard, RateLimitGuard } from "./security.guards";

const bearer = (value?: string): string | undefined =>
  value?.startsWith("Bearer ") ? value.slice(7) : undefined;
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register") @UseGuards(RateLimitGuard) register(
    @Body() body: { email?: string; password?: string; displayName?: string },
    @Req() req: Request,
  ): Promise<SessionResponse> {
    return this.auth.register(body, req.ip);
  }
  @Post("login") @UseGuards(RateLimitGuard) login(
    @Body() body: { email?: string; password?: string },
    @Req() req: Request,
  ): Promise<SessionResponse> {
    return this.auth.login(body, req.ip);
  }
  @Post("refresh") @UseGuards(RateLimitGuard) refresh(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
  ): Promise<SessionResponse> {
    return this.auth.refresh(body.refreshToken, req.ip);
  }
  @Post("logout") logout(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
  ): Promise<void> {
    return this.auth.logout(body.refreshToken, req.ip);
  }
  @Get("me") @UseGuards(AccessGuard) me(
    @Req() req: Request,
    @Headers("authorization") authorization?: string,
  ) {
    return this.auth.user(this.auth.verifyAccess(bearer(authorization)).sub);
  }
  @Patch("me") @UseGuards(AccessGuard) profile(
    @Body()
    body: {
      displayName?: string;
      interfaceLocale?: string;
      notificationsEnabled?: boolean;
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.auth.updateProfile(
      this.auth.verifyAccess(bearer(authorization)).sub,
      body,
    );
  }
  @Post("onboarding") @UseGuards(AccessGuard) onboarding(
    @Body()
    body: {
      locale?: string;
      language?: string;
      goal?: string;
      dailyMinutes?: number;
    },
    @Headers("authorization") authorization?: string,
  ) {
    return this.auth.completeOnboarding(
      this.auth.verifyAccess(bearer(authorization)).sub,
      body,
    );
  }
  @Post("me/export") @UseGuards(AccessGuard) export(
    @Headers("authorization") authorization?: string,
  ) {
    return this.auth.requestExport(
      this.auth.verifyAccess(bearer(authorization)).sub,
    );
  }
  @Delete("me") @UseGuards(AccessGuard) remove(
    @Headers("authorization") authorization?: string,
  ) {
    return this.auth.requestDeletion(
      this.auth.verifyAccess(bearer(authorization)).sub,
    );
  }
}
