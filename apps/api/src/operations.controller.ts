import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { OperationsService } from "./operations.service";
import { AccessGuard } from "./security.guards";

const bearer = (value?: string): string | undefined =>
  value?.startsWith("Bearer ") ? value.slice(7) : undefined;

@Controller("operations")
@UseGuards(AccessGuard)
export class OperationsController {
  constructor(
    private readonly operations: OperationsService,
    private readonly auth: AuthService,
  ) {}

  @Get("privacy")
  privacy(@Headers("authorization") authorization?: string) {
    return this.operations.privacySettings(this.userId(authorization));
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
    @Headers("authorization") authorization?: string,
  ) {
    return this.operations.updatePreference(this.userId(authorization), body);
  }

  @Post("support")
  support(
    @Body() body: { category?: string; subject?: string; message?: string },
    @Headers("authorization") authorization?: string,
  ) {
    return this.operations.support(this.userId(authorization), body);
  }

  @Post("maintenance")
  async maintenance(
    @Body() body: { job?: "notifications" | "retention" },
    @Headers("authorization") authorization?: string,
  ) {
    const token = this.auth.verifyAccess(bearer(authorization));
    if (token.role !== "admin") throw new ForbiddenException();
    return body.job === "notifications"
      ? this.operations.queueDueNotifications()
      : this.operations.runRetention();
  }

  private userId(authorization?: string): string {
    return this.auth.verifyAccess(bearer(authorization)).sub;
  }
}
