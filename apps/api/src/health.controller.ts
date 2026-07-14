import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { HealthResponse } from "@shellty/api-contracts";
import type { ApiEnvironment } from "@shellty/config";

import { API_ENVIRONMENT } from "./app-logger";
import { CorrelationContext } from "./correlation";
import { PrismaService } from "./prisma.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_ENVIRONMENT) private readonly environment: ApiEnvironment,
    private readonly correlation: CorrelationContext,
  ) {}

  @Get("live")
  live(): HealthResponse {
    return this.response("ok", "not-checked");
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
