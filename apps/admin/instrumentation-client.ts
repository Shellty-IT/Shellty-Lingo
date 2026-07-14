import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  sendDefaultPii: false,
  tracesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === "production" ? 0.1 : 0,
  beforeSend(event) {
    delete event.user;
    delete event.request;
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
