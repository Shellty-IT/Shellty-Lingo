import { BadRequestException } from "@nestjs/common";
import {
  onboardingRequestSchema,
  registerRequestSchema,
} from "@shellty/api-contracts";
import { describe, expect, it } from "vitest";

import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  it("normalizes a valid register payload", () => {
    const pipe = new ZodValidationPipe(registerRequestSchema);

    const result = pipe.transform({
      email: "  Learner@Example.COM ",
      password: "long-enough-password",
      displayName: "  Learner  ",
      unexpected: "stripped",
    });

    expect(result).toEqual({
      email: "learner@example.com",
      password: "long-enough-password",
      displayName: "Learner",
    });
  });

  it("rejects invalid payloads with a stable code and field details", () => {
    const pipe = new ZodValidationPipe(registerRequestSchema);

    try {
      pipe.transform({ email: "not-an-email", password: "short" });
      expect.unreachable("transform should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const body = (error as BadRequestException).getResponse() as {
        code: string;
        details: Array<{ path: string }>;
      };
      expect(body.code).toBe("VALIDATION_FAILED");
      expect(body.details.map((detail) => detail.path)).toEqual(
        expect.arrayContaining(["email", "password"]),
      );
    }
  });

  it("clamps onboarding minutes and validates the IANA timezone", () => {
    const pipe = new ZodValidationPipe(onboardingRequestSchema);

    const result = pipe.transform({
      locale: "pl",
      language: "en",
      goal: "work",
      dailyMinutes: 600,
      timezone: "Europe/Warsaw",
    });
    expect(result.dailyMinutes).toBe(120);

    expect(() =>
      pipe.transform({
        locale: "pl",
        language: "en",
        goal: "work",
        timezone: "Mars/Olympus_Mons",
      }),
    ).toThrow(BadRequestException);
  });
});
