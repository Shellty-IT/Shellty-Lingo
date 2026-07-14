import * as Sentry from "@sentry/nextjs";

export function register(): void {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: Boolean(process.env.SENTRY_DSN),
      sendDefaultPii: false,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
      beforeSend(event) {
        delete event.user;
        delete event.request;
        return event;
      },
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
