import { Injectable, type LoggerService } from "@nestjs/common";
import type { ApiEnvironment } from "@shellty/config";

import { CorrelationContext } from "./correlation";

export const API_ENVIRONMENT = Symbol("API_ENVIRONMENT");

@Injectable()
export class AppLogger implements LoggerService {
  constructor(
    private readonly correlation: CorrelationContext,
    private readonly environment: ApiEnvironment,
  ) {}

  log(message: unknown, context?: string): void {
    this.write("info", message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write("error", message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write("warn", message, context);
  }

  debug(message: unknown, context?: string): void {
    if (this.environment.LOG_LEVEL === "debug")
      this.write("debug", message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.debug(message, context);
  }

  private write(
    level: string,
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: "shellty-lingo-api",
      environment: this.environment.APP_ENV,
      correlationId: this.correlation.getId(),
      context,
      message:
        typeof message === "string" ? message : "Structured application event",
      ...(typeof message === "object" && message !== null
        ? { data: message }
        : {}),
      ...(trace ? { trace } : {}),
    };
    const output = JSON.stringify(entry);
    if (level === "error") console.error(output);
    else if (level === "warn") console.warn(output);
    else console.log(output);
  }
}
