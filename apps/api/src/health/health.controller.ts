import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { HealthResponse } from "@shellty/api-contracts";
import type { ApiEnvironment } from "@shellty/config";
import { ApiTags } from "@nestjs/swagger";

import { API_ENVIRONMENT } from "../core/app-logger";
import { CorrelationContext } from "../core/correlation";
import { PrismaService } from "../core/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
    private readonly correlation: CorrelationContext,
  ) {}

  @Get()
  live(): HealthResponse {
    return this.response("ok", "not-checked");
  }

  @Get("live")
  liveVersioned(): HealthResponse {
    return this.live();
  }

  @Get("ready")
  async ready(): Promise<HealthResponse> {
    try {
      await this.prisma.checkConnection();
      return this.response("ok", "connected");
    } catch {
      throw new ServiceUnavailableException(
        this.response("degraded", "unavailable"),
      );
    }
  }

  private response(
    status: HealthResponse["status"],
    database: HealthResponse["database"],
  ): HealthResponse {
    return {
      service: "shellty-lingo-api",
      status,
      database,
      environment: this.environment.APP_ENV,
      version: this.environment.APP_VERSION,
      timestamp: new Date().toISOString(),
      correlationId: this.correlation.getId(),
    };
  }
}
