import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from "@nestjs/common";
import * as Sentry from "@sentry/node";
import type { Response } from "express";

import { AppLogger } from "./app-logger";
import { CorrelationContext } from "./correlation";

type ExceptionBody = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
};

const defaultCode = (status: number): string =>
  status === Number(HttpStatus.BAD_REQUEST)
    ? "BAD_REQUEST"
    : status === Number(HttpStatus.UNAUTHORIZED)
      ? "UNAUTHORIZED"
      : status === Number(HttpStatus.FORBIDDEN)
        ? "FORBIDDEN"
        : status === Number(HttpStatus.NOT_FOUND)
          ? "NOT_FOUND"
          : status === Number(HttpStatus.TOO_MANY_REQUESTS)
            ? "RATE_LIMITED"
            : status >= 500
              ? "INTERNAL_ERROR"
              : "REQUEST_FAILED";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly correlation: CorrelationContext,
    private readonly logger: AppLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status: number =
      exception instanceof HttpException
        ? exception.getStatus()
        : Number(HttpStatus.INTERNAL_SERVER_ERROR);
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body: ExceptionBody =
      typeof raw === "object" && raw !== null ? raw : { message: raw };
    const code =
      typeof body.code === "string" && body.code.length <= 100
        ? body.code
        : defaultCode(status);
    const message =
      status >= 500
        ? "The request could not be completed."
        : typeof body.message === "string"
          ? body.message
          : "The request could not be completed.";
    const correlationId = this.correlation.getId();

    if (status >= 500) {
      Sentry.captureException(exception);
      this.logger.error(
        { event: "request_failed", status, code },
        exception instanceof Error ? exception.stack : undefined,
        "Http",
      );
    }

    response.status(status).json({
      error: {
        code,
        message,
        ...(body.details !== undefined ? { details: body.details } : {}),
        correlationId,
      },
    });
  }
}
