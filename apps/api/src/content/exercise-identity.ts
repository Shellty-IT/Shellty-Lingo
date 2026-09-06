import { createHash } from "node:crypto";

type ExerciseIdentityInput = {
  language: string;
  type: string;
  prompt: string;
  options?: unknown;
};

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  return value;
};

const normalizedPrompt = (prompt: string): string =>
  prompt.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const stableOptions = (options: unknown): unknown => {
  if (
    !Array.isArray(options) ||
    !options.every(
      (option) =>
        option &&
        typeof option === "object" &&
        typeof (option as Record<string, unknown>)["id"] === "string",
    )
  )
    return options ?? null;
  const identifiedOptions = options as Array<Record<string, unknown>>;
  return [...identifiedOptions].sort((left, right) =>
    String(left["id"]).localeCompare(String(right["id"])),
  );
};

/**
 * Stable identity of the actual task, independent of a revision or database id.
 * The database maps each identity to one level, while allowing a task to survive
 * unchanged across successive revisions of the same level.
 */
export const exerciseFingerprint = (input: ExerciseIdentityInput): string =>
  createHash("sha256")
    .update(
      JSON.stringify(
        stableValue({
          language: input.language.trim().toLocaleLowerCase(),
          type: input.type,
          prompt: normalizedPrompt(input.prompt),
          options: stableOptions(input.options),
        }),
      ),
    )
    .digest("hex");
