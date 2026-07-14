declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_SENTRY_DSN?: string;
    APP_ENV?: "development" | "staging" | "production";
  }
}
