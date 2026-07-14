import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

import { AppLogger } from "./app-logger";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = performance.now();
    response.once("finish", () => {
      this.logger.log(
        {
          event: "http_request_completed",
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Http",
      );
    });
    next();
  }
}
