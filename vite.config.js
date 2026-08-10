import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const sentryBuildEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryBuildEnabled && sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      telemetry: false,
      sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
    }),
  ].filter(Boolean),
  build: { sourcemap: sentryBuildEnabled ? 'hidden' : false },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    restoreMocks: true,
    clearMocks: true,
  },
  server: {
    // Pinned: the backend's CORS allow-list is scoped to this exact origin
    // (see backend/.env CORS_ALLOWED_ORIGINS). Letting Vite silently fall back
    // to 5174 when 5173 is busy would produce confusing CORS failures, so fail
    // loudly instead.
    port: 5173,
    strictPort: true,
  },
})
