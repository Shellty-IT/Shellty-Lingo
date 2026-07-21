import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ThrottlerGuard } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import {
  loginRequestSchema,
  logoutRequestSchema,
  onboardingRequestSchema,
  refreshRequestSchema,
  registerRequestSchema,
  updateProfileRequestSchema,
  type LoginRequest,
  type LogoutRequest,
  type OnboardingRequest,
  type RefreshRequest,
  type RegisterRequest,
  type SessionResponse,
  type UpdateProfileRequest,
} from "@shellty/api-contracts";

import { AuthService, type TokenPayload } from "./auth.service";
import { AccessGuard, CurrentUser } from "./security.guards";
import { ZodValidationPipe } from "../core/zod-validation.pipe";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @UseGuards(ThrottlerGuard)
  register(
    @Body(new ZodValidationPipe(registerRequestSchema)) body: RegisterRequest,
    @Req() req: Request,
  ): Promise<SessionResponse> {
    return this.auth.register(body, req.ip);
  }

  @Post("login")
  @UseGuards(ThrottlerGuard)
  login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
    @Req() req: Request,
  ): Promise<SessionResponse> {
    return this.auth.login(body, req.ip);
  }

  @Post("refresh")
  @UseGuards(ThrottlerGuard)
  refresh(
    @Body(new ZodValidationPipe(refreshRequestSchema)) body: RefreshRequest,
    @Req() req: Request,
  ): Promise<SessionResponse> {
    return this.auth.refresh(body.refreshToken, req.ip);
  }

  @Post("logout")
  logout(
    @Body(new ZodValidationPipe(logoutRequestSchema)) body: LogoutRequest,
    @Req() req: Request,
  ): Promise<void> {
    return this.auth.logout(body.refreshToken, req.ip);
  }

  @Get("me")
  @UseGuards(AccessGuard)
  me(@CurrentUser() user: TokenPayload) {
    return this.auth.user(user.sub);
  }

  @Patch("me")
  @UseGuards(AccessGuard)
  profile(
    @Body(new ZodValidationPipe(updateProfileRequestSchema))
    body: UpdateProfileRequest,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.auth.updateProfile(user.sub, body);
  }

  @Post("onboarding")
  @UseGuards(AccessGuard)
  onboarding(
    @Body(new ZodValidationPipe(onboardingRequestSchema))
    body: OnboardingRequest,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.auth.completeOnboarding(user.sub, body);
  }

  @Post("me/export")
  @UseGuards(AccessGuard)
  export(@CurrentUser() user: TokenPayload) {
    return this.auth.requestExport(user.sub);
  }

  @Delete("me")
  @UseGuards(AccessGuard, ThrottlerGuard)
  remove(@CurrentUser() user: TokenPayload) {
    return this.auth.requestDeletion(user.sub);
  }
}
