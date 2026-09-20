import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createExerciseTutor,
  exerciseTutorHintPrompt,
  parseExerciseTutorHint,
  parseHintSafetyReview,
  type ExerciseTutorHintRequest,
} from "./ai-exercise-tutor";

const request: ExerciseTutorHintRequest = {
  exerciseType: "gap_fill",
  language: "en",
  interfaceLocale: "pl",
  level: "A2",
  prompt: "The report is ___ on Friday.",
  instructions: "Type the missing word.",
  referenceAnswers: ["due"],
  learnerDraft: "",
};

const baseEnvironment = {
  AI_PROVIDER_ORDER: ["groq"],
  GROQ_API_KEY: "test-key",
  GROQ_MODEL: "openai/gpt-oss-120b",
  GEMINI_API_KEY: undefined,
  GEMINI_MODEL: "gemini-3.6-flash",
  AI_REQUEST_TIMEOUT_MS: 5_000,
  AI_MAX_RETRIES: 0,
} as never;

const groqResponse = (
  content: Record<string, unknown>,
  promptTokens: number,
  completionTokens: number,
) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
      },
    }),
    { status: 200 },
  );

const geminiResponse = (
  content: Record<string, unknown>,
  promptTokens: number,
  completionTokens: number,
) =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(content) }] } }],
      usageMetadata: {
        promptTokenCount: promptTokens,
        candidatesTokenCount: completionTokens,
      },
    }),
    { status: 200 },
  );

afterEach(() => vi.restoreAllMocks());

describe("exercise tutor hint", () => {
  it("requires one hint without revealing the solution", () => {
    const prompt = exerciseTutorHintPrompt(request);

    expect(prompt).toContain("Do not complete the gap");
    expect(prompt).toContain("Polish");
    expect(prompt).not.toContain("due");
  });

  it("parses bounded generation and safety contracts", () => {
    expect(
      parseExerciseTutorHint(
        'prefix {"hint":"Pomyśl o przymiotniku oznaczającym termin wykonania.","focus":"vocabulary"}',
      ),
    ).toEqual({
      hint: "Pomyśl o przymiotniku oznaczającym termin wykonania.",
      focus: "vocabulary",
    });
    expect(parseHintSafetyReview('{"safe":true,"reason":"safe"}')).toEqual({
      safe: true,
      reason: "safe",
    });
  });

  it("rejects invalid structured output", () => {
    expect(() =>
      parseExerciseTutorHint('{"hint":"","focus":"answer"}'),
    ).toThrow("did not match its schema");
    expect(() =>
      parseHintSafetyReview('{"safe":true,"reason":"answer"}'),
    ).toThrow("did not match its schema");
  });

  it("generates and independently reviews a hint through Groq", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        groqResponse(
          {
            hint: "Zastanów się, jaki przymiotnik opisuje ustalony termin.",
            focus: "vocabulary",
          },
          100,
          20,
        ),
      )
      .mockResolvedValueOnce(
        groqResponse({ safe: true, reason: "safe" }, 50, 5),
      );
    vi.stubGlobal("fetch", fetchMock);

    const outcome = await createExerciseTutor(baseEnvironment)!.hint(request);

    expect(outcome).toMatchObject({
      servedBy: "groq",
      result: { inputTokens: 150, outputTokens: 25, focus: "vocabulary" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const payloads = fetchMock.mock.calls.map(
      ([, init]) => JSON.parse((init as RequestInit).body as string) as unknown,
    ) as Array<{
      response_format: { json_schema: { name: string; strict: boolean } };
      messages: Array<{ content: string }>;
    }>;
    expect(payloads[0]!.response_format.json_schema).toMatchObject({
      name: "exercise_tutor_hint",
      strict: true,
    });
    expect(payloads[1]!.response_format.json_schema).toMatchObject({
      name: "exercise_hint_safety",
      strict: true,
    });
    expect(JSON.parse(payloads[0]!.messages[1]!.content)).toMatchObject({
      task: request.prompt,
      referenceAnswers: request.referenceAnswers,
    });
  });

  it("falls back to Gemini after a Groq rate-limit response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(
        geminiResponse(
          {
            hint: "Sprawdź, jakiej części mowy wymaga zdanie.",
            focus: "grammar",
          },
          80,
          15,
        ),
      )
      .mockResolvedValueOnce(
        geminiResponse({ safe: true, reason: "safe" }, 40, 4),
      );
    vi.stubGlobal("fetch", fetchMock);
    const tutor = createExerciseTutor({
      ...(baseEnvironment as object),
      AI_PROVIDER_ORDER: ["groq", "gemini"],
      GEMINI_API_KEY: "gemini-key",
    } as never);

    const outcome = await tutor!.hint(request);

    expect(outcome).toMatchObject({
      servedBy: "gemini",
      result: { inputTokens: 120, outputTokens: 19, focus: "grammar" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("rejects a generated hint when the independent review detects an answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          groqResponse({ hint: "Wpisz due.", focus: "vocabulary" }, 60, 8),
        )
        .mockResolvedValueOnce(
          groqResponse({ safe: false, reason: "answer" }, 30, 4),
        ),
    );

    await expect(
      createExerciseTutor(baseEnvironment)!.hint(request),
    ).rejects.toThrow("Unsafe exercise hint");
  });
});
