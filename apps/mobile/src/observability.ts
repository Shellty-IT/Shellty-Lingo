import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  enableNative: true,
  tracesSampleRate: process.env.APP_ENV === "production" ? 0.1 : 0,
  beforeSend(event) {
    delete event.user;
    delete event.request;
    return event;
  },
});

export { Sentry };
