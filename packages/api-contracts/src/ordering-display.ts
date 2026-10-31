/** Give every ordering tile the same casing and hide sentence-boundary marks. */
export function orderingTileText(text: string): string {
  const trimmed = text.trim();
  const withoutBoundaryMarks = trimmed.replace(
    /[.!?,;:]+$/u,
    (marks, offset: number) =>
      // Keep the dot in an initialism such as U.S., even before a comma.
      marks.startsWith(".") &&
      /(?:\p{L}\.)+\p{L}$/u.test(trimmed.slice(0, offset))
        ? "."
        : "",
  );
  return withoutBoundaryMarks.replace(
    /^(\P{L}*)(\p{Ll})/u,
    (_, prefix: string, firstLetter: string) =>
      `${prefix}${firstLetter.toLocaleUpperCase()}`,
  );
}
