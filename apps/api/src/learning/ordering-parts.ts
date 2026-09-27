import { isRecord } from "./learning-support";

type OrderingPart = { id: string; text: string; displayText?: string };

const parseOptions = (options: unknown): OrderingPart[] =>
  Array.isArray(options)
    ? options.flatMap((option) =>
        isRecord(option) &&
        typeof option["id"] === "string" &&
        typeof option["text"] === "string"
          ? [
              {
                id: option["id"],
                text: option["text"],
                ...(typeof option["displayText"] === "string"
                  ? { displayText: option["displayText"] }
                  : {}),
              },
            ]
          : [],
      )
    : [];

const wordsIn = (text: string): string[] =>
  text
    .normalize("NFKC")
    .match(
      /(?:\p{N}+(?:[.:]\p{N}+)+|[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*)/gu,
    ) ?? [];

const phraseStarts = new Set(
  "a an the this these those my your our their to for from in on at over with by after before and but because".split(
    " ",
  ),
);
const needsNextWord = new Set([
  ...phraseStarts,
  ..."i you we they he she it can could will would should must have has had is are was were do does did".split(
    " ",
  ),
]);

/** Prefer phrase boundaries to equal slices for legacy English word banks. */
function groupWords(parts: OrderingPart[]): OrderingPart[][] {
  const count = Math.min(4, Math.max(2, Math.ceil(parts.length / 4)));
  const average = parts.length / count;
  const words = parts.map((part) => wordsIn(part.text).join(" ").toLowerCase());
  const memo = new Map<string, { score: number; groups: OrderingPart[][] }>();
  const split = (
    start: number,
    remaining: number,
  ): { score: number; groups: OrderingPart[][] } => {
    if (remaining === 1)
      return {
        score: (parts.length - start - average) ** 2 / 4,
        groups: [parts.slice(start)],
      };
    const key = `${start}:${remaining}`;
    const cached = memo.get(key);
    if (cached) return cached;
    let best = { score: Infinity, groups: [] as OrderingPart[][] };
    for (
      let end = start + 2;
      end <= parts.length - 2 * (remaining - 1);
      end += 1
    ) {
      const next = split(end, remaining - 1);
      const boundary = needsNextWord.has(words[end - 1]!)
        ? 10
        : /[,;.!?]$/u.test(parts[end - 1]!.text.trim())
          ? -4
          : phraseStarts.has(words[end]!)
            ? -3
            : 0;
      const score = (end - start - average) ** 2 / 4 + boundary + next.score;
      if (score < best.score)
        best = { score, groups: [parts.slice(start, end), ...next.groups] };
    }
    memo.set(key, best);
    return best;
  };
  return split(0, count).groups;
}

/** Preserve authored spelling. Only editors may supply a separate displayText. */
export function orderingParts(
  options: unknown,
  answer: unknown,
  localizedOptions?: unknown,
  language: "en" | "th" = "en",
): OrderingPart[] {
  const parsed = parseOptions(options);
  const correct =
    isRecord(answer) && Array.isArray(answer["correct"])
      ? answer["correct"].filter((id): id is string => typeof id === "string")
      : [];
  const byId = new Map(parsed.map((option) => [option.id, option]));
  const ordered = correct
    .map((id) => byId.get(id))
    .filter((part): part is OrderingPart => Boolean(part));
  if (ordered.length === 0) return [];
  const localizedById = new Map(
    parseOptions(localizedOptions).map((option) => [
      option.id,
      option.displayText ?? option.text,
    ]),
  );
  const displayText = (part: OrderingPart) =>
    (localizedById.get(part.id) ?? part.displayText ?? part.text).trim();

  // Older generated lessons store a whole sentence as individual words.
  // Limit those to two to four tappable phrases without changing authored chunks.
  if (
    language === "en" &&
    ordered.length >= 4 &&
    ordered.every((part) => wordsIn(part.text).length === 1) &&
    ordered.some((part) => /[a-z]/iu.test(part.text))
  ) {
    return groupWords(ordered).map((group, index) => ({
      id: `ordering-part-${index + 1}`,
      text: group.map(displayText).join(" "),
    }));
  }

  // Older authored lessons can also contain a few isolated words between
  // useful phrases. Join those with a neighbour before presenting the task.
  if (
    language === "en" &&
    ordered.length >= 4 &&
    ordered.some((part) => wordsIn(part.text).length === 1) &&
    ordered.some((part) => /[a-z]/iu.test(part.text))
  ) {
    const groups: Array<{ start: number; end: number }> = [];
    for (let index = 0; index < ordered.length; index += 1) {
      if (wordsIn(ordered[index]!.text).length !== 1) {
        groups.push({ start: index, end: index });
        continue;
      }
      const previous = groups.at(-1);
      if (previous && previous.start === previous.end) {
        previous.end = index;
      } else if (index + 1 < ordered.length) {
        groups.push({ start: index, end: index + 1 });
        index += 1;
      } else if (previous) {
        previous.end = index;
      }
    }
    return groups.map(({ start, end }) => ({
      id: start === end ? ordered[start]!.id : `ordering-part-${start + 1}`,
      text: ordered
        .slice(start, end + 1)
        .map(displayText)
        .join(" "),
    }));
  }

  return ordered.map((part) => ({
    id: part.id,
    text: displayText(part),
  }));
}
