import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Boundary validation for request bodies against a shared contract schema.
 * Usage: `@Body(new ZodValidationPipe(registerRequestSchema)) body: RegisterRequest`.
 * Services behind a validated route can rely on normalized, typed input.
 */
export class ZodValidationPipe<Output> implements PipeTransform {
  constructor(private readonly schema: ZodType<Output>) {}

  transform(value: unknown): Output {
    const result = this.schema.safeParse(value);
    if (!result.success)
      throw new BadRequestException({
        code: "VALIDATION_FAILED",
        message: "Request validation failed.",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    return result.data;
  }
}
