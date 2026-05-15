import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
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
