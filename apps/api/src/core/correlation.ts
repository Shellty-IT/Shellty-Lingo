import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

import { Injectable, type NestMiddleware } from "@nestjs/common";
import { CORRELATION_ID_HEADER } from "@shellty/api-contracts";
import type { NextFunction, Request, Response } from "express";

interface RequestContext {
  correlationId: string;
}

const correlationIdPattern = /^[a-zA-Z0-9_-]{8,128}$/;

@Injectable()
export class CorrelationContext {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run(correlationId: string, callback: () => void): void {
    this.storage.run({ correlationId }, callback);
  }

  getId(): string {
    return this.storage.getStore()?.correlationId ?? "outside-request";
  }
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly context: CorrelationContext) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const provided = request.header(CORRELATION_ID_HEADER);
    const correlationId =
      provided && correlationIdPattern.test(provided) ? provided : randomUUID();

    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    this.context.run(correlationId, next);
  }
}
