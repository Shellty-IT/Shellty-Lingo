import { Platform } from "react-native";
import {
  EncodingType,
  deleteAsync,
  readAsStringAsync,
} from "expo-file-system/legacy";

export async function recordingToBase64(uri: string): Promise<string> {
  if (Platform.OS !== "web")
    return readAsStringAsync(uri, { encoding: EncodingType.Base64 });

  const response = await fetch(uri);
  if (!response.ok) throw new Error("Could not read the local recording.");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not encode the recording."));
    reader.onloadend = () => {
      const result = reader.result;
      const comma = typeof result === "string" ? result.indexOf(",") : -1;
      if (typeof result !== "string" || comma < 0)
        reject(new Error("Could not encode the recording."));
      else resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export async function discardLocalRecording(uri: string): Promise<void> {
  if (Platform.OS === "web") {
    URL.revokeObjectURL(uri);
    return;
  }
  await deleteAsync(uri, { idempotent: true });
}
