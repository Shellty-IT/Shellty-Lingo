import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import type { ApiEnvironment } from "@shellty/config";

import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(environment: ApiEnvironment) {
    super({
      adapter: new PrismaPg({ connectionString: environment.DATABASE_URL }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async checkConnection(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
