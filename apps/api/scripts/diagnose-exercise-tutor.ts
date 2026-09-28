import { resolve } from "node:path";
import { config } from "dotenv";
import { parseApiEnvironment } from "@shellty/config";
import {
  createExerciseTutor,
  ExerciseTutorUnavailableError,
} from "../src/ai/ai-exercise-tutor";
import { hintRevealsReferenceAnswer } from "../src/learning/lesson-session.service";

config({ path: resolve(__dirname, "../.env"), quiet: true });
const environment = parseApiEnvironment(process.env);
const selectedProvider = process.argv
  .find((value) => value.startsWith("--provider="))
  ?.slice("--provider=".length);
const selectedModel = process.argv
  .find((value) => value.startsWith("--model="))
  ?.slice("--model=".length);
const gapExample = process.argv.includes("--gap-example");
if (
  selectedProvider &&
  selectedProvider !== "groq" &&
  selectedProvider !== "gemini"
)
  throw new Error("Use --provider=groq or --provider=gemini.");
if (
  selectedModel &&
  (!selectedProvider || !/^[a-zA-Z0-9./_-]{1,100}$/.test(selectedModel))
)
  throw new Error("Specify a provider and a valid model ID.");
if (selectedProvider === "groq" || selectedProvider === "gemini") {
  environment.AI_PROVIDER_ORDER = [selectedProvider];
  environment.AI_TUTOR_GROQ_FALLBACK_MODELS = [];
  environment.AI_TUTOR_GEMINI_FALLBACK_MODELS = [];
  if (selectedModel && selectedProvider === "groq")
    environment.GROQ_MODEL = selectedModel;
  if (selectedModel && selectedProvider === "gemini")
    environment.GEMINI_MODEL = selectedModel;
}
const originalFetch = globalThis.fetch;

// Log response metadata only: never keys, prompts, answers or generated text.
globalThis.fetch = async (input, init) => {
  const response = await originalFetch(input, init);
  const request = JSON.parse(
    typeof init?.body === "string" ? init.body : "{}",
  ) as { model?: string };
  const body = (await response
    .clone()
    .json()
    .catch(() => ({}))) as {
    choices?: Array<{ finish_reason?: string; message?: { content?: string } }>;
    usage?: {
      completion_tokens?: number;
      completion_tokens_details?: { reasoning_tokens?: number };
    };
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: {
      candidatesTokenCount?: number;
      thoughtsTokenCount?: number;
    };
    error?: { code?: unknown; status?: string };
  };
  const url = new URL(input instanceof Request ? input.url : input);
  console.log(
    JSON.stringify({
      provider: url.hostname,
      model: request.model ?? url.pathname.split("/").at(-1)?.split(":")[0],
      status: response.status,
      retryAfter: response.headers.get("retry-after"),
      remainingRequests: response.headers.get("x-ratelimit-remaining-requests"),
      remainingTokens: response.headers.get("x-ratelimit-remaining-tokens"),
      finishReason:
        body.choices?.[0]?.finish_reason ?? body.candidates?.[0]?.finishReason,
      outputTokens:
        body.usage?.completion_tokens ??
        body.usageMetadata?.candidatesTokenCount,
      reasoningTokens:
        body.usage?.completion_tokens_details?.reasoning_tokens ??
        body.usageMetadata?.thoughtsTokenCount,
      contentCharacters:
        body.choices?.[0]?.message?.content?.length ??
        body.candidates?.[0]?.content?.parts?.reduce(
          (sum, part) => sum + (part.text?.length ?? 0),
          0,
        ),
      errorCode:
        typeof body.error?.code === "number" ||
        (typeof body.error?.code === "string" &&
          /^[a-zA-Z0-9_]+$/.test(body.error.code))
          ? body.error?.code
          : undefined,
      errorStatus: /^[A-Z_]+$/.test(body.error?.status ?? "")
        ? body.error?.status
        : undefined,
      safetyReason: (() => {
        const content =
          body.choices?.[0]?.message?.content ??
          body.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("");
        try {
          const parsed = JSON.parse(content ?? "") as { reason?: unknown };
          return typeof parsed.reason === "string" &&
            [
              "safe",
              "answer",
              "translation",
              "spelling",
              "completion",
            ].includes(parsed.reason)
            ? parsed.reason
            : undefined;
        } catch {
          return undefined;
        }
      })(),
    }),
  );
  return response;
};

async function main() {
  try {
    const tutor = createExerciseTutor(environment, (failure) =>
      console.log(JSON.stringify({ event: "model_failed", ...failure })),
    );
    if (!tutor) throw new Error("No exercise tutor configured.");
    const referenceAnswers = gapExample
      ? ["had made"]
      : [
          "Your presentation was well structured; next time, try to support your conclusion with more data.",
        ];
    const outcome = await tutor.hint({
      exerciseType: gapExample ? "gap_fill" : "typed_answer",
      language: "en",
      interfaceLocale: "pl",
      level: "B2",
      prompt: gapExample
        ? "I realised that I ___ the same mistake before."
        : "Praise one strength and identify one specific area for improvement.",
      referenceAnswers,
    });
    const blocked = hintRevealsReferenceAnswer(
      outcome.result.hint,
      referenceAnswers,
    );
    console.log(
      JSON.stringify({
        result: blocked ? "blocked_by_local_review" : "available",
        servedBy: outcome.servedBy,
        servedModel: outcome.servedModel,
      }),
    );
    if (blocked) process.exitCode = 1;
  } catch (error) {
    console.log(
      JSON.stringify({
        result: "unavailable",
        ...(error instanceof ExerciseTutorUnavailableError
          ? { failures: error.failures }
          : { reason: "Diagnostic failed." }),
      }),
    );
    process.exitCode = 1;
  } finally {
    globalThis.fetch = originalFetch;
  }
}
void main();
