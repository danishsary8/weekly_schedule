# Daycraft reliability operations

## Current code-only safeguards

- `/schedule/today` uses fixed-query eager loading and a versioned 60-second
  per-user cache. Every day-group, timeline-entry, and checklist-item mutation
  changes that user's cache version before returning.
- Public prayer calculations are cached for 24 hours by date, calculation
  method, and coordinates rounded to two decimals. Each user still receives a
  separate database cache row; account/location records are never shared.
- The current Render configuration uses Laravel's PostgreSQL-backed database
  cache. Redis is not provisioned or assumed.
- Authenticated API traffic is limited to 120 requests/minute per user. Tighter
  endpoint limits remain on login, registration, verification, OAuth, and reset.
- Expected validation/auth/not-found/rate-limit failures are not reported as
  server errors. Unexpected failures are sent only when a Sentry DSN exists.

## Configure Sentry

Create a free Sentry account and two projects in the same organization:

1. A **Laravel** project named `daycraft-api`.
2. A **React** project named `daycraft-web`.

Render environment variables:

```text
SENTRY_LARAVEL_DSN=<Laravel project DSN>
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=<deployment commit SHA>
SENTRY_SAMPLE_RATE=1.0
SENTRY_TRACES_SAMPLE_RATE=0.05
```

Vercel runtime/build variables:

```text
VITE_SENTRY_DSN=<React project DSN>
VITE_SENTRY_RELEASE=<deployment commit SHA>
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05
VITE_SENTRY_TEST=false
SENTRY_AUTH_TOKEN=<Sentry organization token with release/source-map access>
SENTRY_ORG=<organization slug>
SENTRY_PROJECT=daycraft-web
```

The SDKs send user ID only. Request bodies, cookies, query strings, auth/XSRF
headers, SQL bindings, email addresses, IP addresses, and usernames are not sent.
Source maps are uploaded privately during a credentialed Vercel build and then
deleted from `dist`.

### Prove event delivery

Backend: from a trusted local shell with the Laravel project DSN set, run:

```bash
php backend/artisan sentry:test
```

Confirm `Sentry Laravel Test` appears in `daycraft-api`, then remove the local
DSN. Frontend: temporarily set `VITE_SENTRY_TEST=true` in Vercel, deploy once,
open the site, confirm `Daycraft frontend Sentry verification event` appears in
`daycraft-web`, then set it back to `false` and redeploy. Never leave the test
flag enabled because every cold load would create noise.

These receipt checks cannot be completed without project DSNs and dashboard
access. SDK presence alone is not treated as proof.

## Configure UptimeRobot

Create one HTTP(S) monitor:

- Friendly name: `Daycraft API health`
- URL: `https://<render-api-host>/api/v1/health`
- Interval: 5 minutes on the free plan
- Method: `GET`
- Expected status: `200`
- Keyword assertion: `"status":"ok"`
- Timeout: 30 seconds
- Alerts: verified owner email, after two consecutive failures if available

Optionally add a second HTTP monitor for the Vercel root URL expecting `200`.
Render free services sleep after inactivity, so a health check also reduces cold
starts; confirm this use complies with the host's current free-tier policy.

## Reminder scaling boundary

Reminders currently run in the browser and are evaluated while the dashboard is
open. This is inexpensive and honest for a small app, but it is not guaranteed
delivery: a closed/suspended tab cannot fire a reminder. At meaningful scale,
move scheduling to server-side queued jobs backed by a durable Redis-style queue,
run a scheduler/worker process, store device push subscriptions, and use Web Push
or platform notifications. That requires background workers and durable queue
infrastructure not included in the current free Render setup.

## Lightweight load check

Run against a disposable environment or supply a test-user token:

```bash
DAYCRAFT_LOAD_URL=https://<api-host>/api/v1 DAYCRAFT_LOAD_TOKEN=<test-token> node scripts/load-test.mjs
```

Defaults are 40 requests with concurrency 10. Without a token, the script creates
and then deletes a disposable account. This is a smoke test, not a capacity or
soak benchmark; free-tier cold starts, shared CPU, geographic latency, and the
temporary database dominate results.

Local Windows development-server observation (August 5, 2026): 40 cached
schedule requests at concurrency 10 completed with zero failures; min 1058 ms,
median 10235 ms, p95 10626 ms, max 10664 ms. The single-process `artisan serve`
server serialized concurrent requests, so these numbers describe that local
development server—not Render capacity or production latency. A deployed result
is pending because no Phase G backend URL exists in this workspace.
