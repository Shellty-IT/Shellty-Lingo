import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import type { TokenPayload } from "../auth/auth.service";
import { OperationsService } from "./operations.service";
import {
  AccessGuard,
  CurrentUser,
  RequireRole,
  RolesGuard,
} from "../auth/security.guards";

@ApiTags("operations")
@Controller("operations")
@UseGuards(AccessGuard, RolesGuard)
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get("privacy")
  privacy(@CurrentUser() user: TokenPayload) {
    return this.operations.privacySettings(user.sub);
  }

  @Patch("notifications")
  notifications(
    @Body()
    body: {
      kind?: string;
      enabled?: boolean;
      localTime?: string;
      timezone?: string;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.operations.updatePreference(user.sub, body);
  }

  @Post("support")
  support(
    @Body() body: { category?: string; subject?: string; message?: string },
    @CurrentUser() user: TokenPayload,
  ) {
    return this.operations.support(user.sub, body);
  }

  @Post("maintenance")
  @RequireRole("admin")
  maintenance(@Body() body: { job?: "notifications" | "retention" }) {
    return body.job === "notifications"
      ? this.operations.queueDueNotifications()
      : this.operations.runRetention();
  }
}
