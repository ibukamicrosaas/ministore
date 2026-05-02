import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? 'https://3110dbe20e088b10fdbf7a095894feb7@o4511274940563456.ingest.de.sentry.io/4511274942857296',
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  ignoreErrors: [
    'NEXT_REDIRECT',
    'NEXT_NOT_FOUND',
    /^AbortError/,
    /^TypeError: Failed to fetch/,
    /^TypeError: NetworkError/,
    /^TypeError: Load failed/,
  ],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
