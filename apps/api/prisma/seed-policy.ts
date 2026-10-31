/** Demo content is self-published, so it must not enter a release environment. */
export function assertDemoSeedEnvironment(
  appEnvironment: string | undefined,
): void {
  if (appEnvironment !== "development" && appEnvironment !== "test")
    throw new Error(
      "Demo content seed is allowed only with APP_ENV=development or APP_ENV=test. Release content requires editorial review.",
    );
}

export function vocabularySeedUpdate(input: {
  definition: string;
  transliteration?: string;
  toneMarks?: string;
}) {
  return {
    definition: input.definition,
    ...(input.transliteration === undefined
      ? {}
      : { transliteration: input.transliteration }),
    ...(input.toneMarks === undefined ? {} : { toneMarks: input.toneMarks }),
  };
}
