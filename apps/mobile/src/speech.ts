import * as Speech from "expo-speech";

let playbackGeneration = 0;
export async function stopSpeech(): Promise<void> {
  playbackGeneration++;
  await Speech.stop();
}

export async function speak(
  text: string,
  language: string,
  rate: number,
  onStart?: () => void,
): Promise<void> {
  const generation = ++playbackGeneration;
  const voices = await Speech.getAvailableVoicesAsync();
  if (generation !== playbackGeneration) return;
  const baseLanguage = language.split("-")[0]?.toLocaleLowerCase();
  const supported = voices.some((voice) =>
    voice.language.toLocaleLowerCase().startsWith(baseLanguage ?? language),
  );
  if (voices.length > 0 && !supported) throw new Error("voice unavailable");
  await Speech.stop();
  if (generation !== playbackGeneration) return;
  await new Promise<void>((resolve, reject) => {
    Speech.speak(text, {
      language,
      rate,
      onStart,
      onDone: resolve,
      onStopped: resolve,
      onError: reject,
    });
  });
}
