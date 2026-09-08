import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createTypedAnswerAssessor,
  parseTypedAnswerAssessment,
  typedAnswerAssessmentPrompt,
  type TypedAnswerAssessmentRequest,
} from "./ai-answer-assessment";

const request: TypedAnswerAssessmentRequest = {
  language: "en",
  interfaceLocale: "pl",
  level: "B2",
  prompt: "Express regret that user feedback was not requested earlier.",
  instructions: "Write the complete answer in English.",
  acceptedAnswers: [
    "I wish we had asked users for feedback earlier.",
    "If only we had requested user feedback earlier.",
  ],
  learnerAnswer: "get a user feedback earlier? What a pity.",
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

afterEach(() => vi.restoreAllMocks());

describe("typed answer assessment", () => {
  it("asks for feedback in the interface language and suggestions in the learning language", () => {
    const prompt = typedAnswerAssessmentPrompt(request);

    expect(prompt).toContain("explanation in Polish");
    expect(prompt).toContain("suggested answer in English");
    expect(prompt).toContain("not an exhaustive list");
  });

  it("rejects a response outside the versioned verdict contract", () => {
    expect(() =>
      parseTypedAnswerAssessment(
        JSON.stringify({
          verdict: "maybe",
          suggestedAnswer: "I wish we had asked earlier.",
          explanation: "Popraw konstrukcję.",
        }),
      ),
    ).toThrow(/verdict/);
  });

  it("assesses through Groq and sends the task as inert JSON data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: "almost",
                  suggestedAnswer:
                    "I wish we had asked users for feedback earlier.",
                  explanation:
                    "Intencja jest czytelna, ale potrzebna jest konstrukcja ‘I wish’ z past perfect.",
                }),
              },
            },
          ],
          usage: { prompt_tokens: 70, completion_tokens: 25 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const assessor = createTypedAnswerAssessor(baseEnvironment);

    const outcome = await assessor!.assess(request);

    expect(outcome.servedBy).toBe("groq");
    expect(outcome.result).toMatchObject({
      verdict: "almost",
      suggestedAnswer: "I wish we had asked users for feedback earlier.",
      inputTokens: 70,
      outputTokens: 25,
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      response_format: { json_schema: { name: string; strict: boolean } };
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.response_format.json_schema).toMatchObject({
      name: "typed_answer_assessment",
      strict: true,
    });
    expect(JSON.parse(body.messages[1]!.content)).toMatchObject({
      task: request.prompt,
      learnerAnswer: request.learnerAnswer,
      referenceAnswers: request.acceptedAnswers,
    });
  });

  it("uses Gemini when the earlier provider fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        verdict: "correct",
                        suggestedAnswer:
                          "I wish we had asked users for feedback earlier.",
                        explanation: "Odpowiedź jest poprawna.",
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const assessor = createTypedAnswerAssessor({
      ...(baseEnvironment as object),
      AI_PROVIDER_ORDER: ["groq", "gemini"],
      GEMINI_API_KEY: "gemini-key",
    } as never);

    const outcome = await assessor!.assess(request);

    expect(outcome.servedBy).toBe("gemini");
    expect(outcome.result.verdict).toBe("correct");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      generationConfig: Record<string, unknown>;
    };
    expect(payload.generationConfig).not.toHaveProperty("temperature");
  });

  it("is disabled cleanly when no remote provider is configured", () => {
    expect(
      createTypedAnswerAssessor({
        ...(baseEnvironment as object),
        AI_PROVIDER_ORDER: [],
        GROQ_API_KEY: undefined,
      } as never),
    ).toBeNull();
  });
});
