import * as Speech from "expo-speech";

export async function speak(
  text: string,
  language: string,
  rate: number,
): Promise<void> {
  const voices = await Speech.getAvailableVoicesAsync();
  const baseLanguage = language.split("-")[0]?.toLocaleLowerCase();
  const supported = voices.some((voice) =>
    voice.language.toLocaleLowerCase().startsWith(baseLanguage ?? language),
  );
  if (voices.length > 0 && !supported) throw new Error("voice unavailable");
  await Speech.stop();
  await new Promise<void>((resolve, reject) => {
    Speech.speak(text, {
      language,
      rate,
      onDone: resolve,
      onStopped: resolve,
      onError: reject,
    });
  });
}
