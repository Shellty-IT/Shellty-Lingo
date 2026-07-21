import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ReleaseModule } from "../release/release.module";
import { ListeningController } from "./listening.controller";
import { ListeningService } from "./listening.service";

@Module({
  imports: [AuthModule, ReleaseModule],
  controllers: [ListeningController],
  providers: [ListeningService],
})
export class ListeningModule {}
