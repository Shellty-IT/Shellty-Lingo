const developmentApiUrl = "http://localhost:3001/v1";
const productionApiUrl = "https://shellty-lingo-api.onrender.com/v1";

export const resolveApiUrl = (
  configuredUrl = process.env.EXPO_PUBLIC_API_URL,
  isDevelopment = typeof __DEV__ !== "undefined" && __DEV__,
): string => {
  const normalized = configuredUrl?.trim().replace(/\/+$/, "");
  if (normalized) return normalized;
  return isDevelopment ? developmentApiUrl : productionApiUrl;
};

export const apiUrl = (): string => resolveApiUrl();
