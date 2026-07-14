import * as SecureStore from "expo-secure-store";
const key = "shellty.session.v1";
export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    profile: {
      displayName: string | null;
      interfaceLocale: "pl" | "en" | "th";
      onboardingCompleted: boolean;
    };
  };
};
export async function readSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(key);
  return raw ? (JSON.parse(raw) as StoredSession) : null;
}
export function saveSession(session: StoredSession): Promise<void> {
  return SecureStore.setItemAsync(key, JSON.stringify(session));
}
export function clearSession(): Promise<void> {
  return SecureStore.deleteItemAsync(key);
}
