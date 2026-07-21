import { Module } from "@nestjs/common";

import { AiModule } from "../ai/ai.module";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { ReleaseModule } from "../release/release.module";
import { GrowthController } from "./growth.controller";
import { GrowthService } from "./growth.service";

@Module({
  imports: [AuthModule, BillingModule, ReleaseModule, AiModule],
  controllers: [GrowthController],
  providers: [GrowthService],
})
export class GrowthModule {}
