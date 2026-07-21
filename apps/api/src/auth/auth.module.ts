import { Module } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccessGuard, RolesGuard } from "./security.guards";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AccessGuard, RolesGuard, ThrottlerGuard],
  exports: [AuthService, AccessGuard, RolesGuard, ThrottlerGuard],
})
export class AuthModule {}
