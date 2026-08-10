# Daycraft — Engineering Handoff

Daycraft is a general-purpose daily routine and habit planner built with React, Vite, Tailwind CSS and Framer Motion, backed by Laravel, PostgreSQL and Sanctum.

## Current architecture

- Every schedule record is owned through `day_groups.user_id`.
- `day_group_weekdays` assigns any combination of Sunday (`0`) through Saturday (`6`).
- Timeline entries and checklist items use numeric primary keys and are edited directly.
- Checklist completion remains per user, item, and calendar date.
- New accounts have no seeded routine. The React dashboard presents the first-group builder when `/day-groups` is empty.
- Live highlighting and reminders consume the flattened schedule returned by `/schedule/today`.
- Prayer-time data remains an optional enhancement and never creates schedule entries.
- Password reset tokens expire after 60 minutes and a successful reset revokes every Sanctum token.
- Google OAuth state is single-use and cached for 10 minutes; its frontend handoff code is single-use and cached for 2 minutes.
- Google identities link by normalized provider-verified email, and successful Google authentication marks that address verified.

## Safety decisions

- Nested resource queries are constrained through the authenticated owner.
- Foreign records return `404` to avoid exposing ownership information.
- Group deletion requires both client confirmation and `confirm=true` at the API boundary, then cascades dependent records.
- Account deletion requires typing `DELETE`; the API explicitly removes non-cascaded authentication records, then force-deletes the user so database foreign keys cascade all product data.

See `README.md` for setup and `backend/API.md` for the current endpoint contract.

## Latest work — Phase E

- Added public `/privacy` and `/terms` pages and linked them from registration and public footers.
- Added `terms_accepted_at` for password and Google registrations.
- Added permanent account deletion at `DELETE /api/v1/account` with type-to-confirm UI.
- Deletion removes all user-owned schedules, checklist history, settings, prayer cache, tokens, reset records, and sessions.
- No cookie banner was added because authentication uses localStorage bearer tokens and Daycraft sets no first-party cookies.
- Verified: 42 backend tests pass (219 assertions) and the frontend production build passes.
- Legal text is an early-stage first draft; replace `privacy@daycraft.app` and obtain legal review before real public or commercial use.

## Latest work — Phase G preparation

- Added Vercel SPA configuration and Render Docker/Blueprint deployment files.
- Added separate local and production env templates; source contains no secrets.
- Render startup runs migrations only, preserving empty-by-default onboarding.
- Added Resend's HTTPS Laravel transport because Render free blocks SMTP.
- Added `DEPLOYMENT.md` with OAuth, email, smoke-test, and domain migration steps.
- Not live yet: this folder has no Git remote, Vercel is not authenticated, and Render/Google/Resend account actions remain.
- Render free PostgreSQL expires after 30 days and is suitable only for a preview unless upgraded or replaced.

## Latest work — Phase F

- Added a logged-out marketing homepage at `/`; authenticated visitors are redirected to `/dashboard`.
- Added an on-brand hero dashboard preview, four-step explanation, six verified feature cards, and final signup CTA.
- Added landing-specific title, description, Open Graph/Twitter metadata, and a real 1200×630 PNG share image.
- Expanded sitemap routes and robots rules; replace the reserved `daycraft.example` sitemap host after Vercel assigns the real URL.
- Added a repeatable Edge responsive audit covering 375px, 768px, 1440px, reduced motion, overflow, and root routing.
- Verified the Vite production build passes. Contact addresses remain provisional placeholders.

## Latest work — Phase H preparation

- Removed the day-group weekday N+1 query: cold `/schedule/today` dropped from 8 queries to 5 for four groups and stays constant as children grow.
- Added a versioned 60-second per-user schedule cache with immediate mutation invalidation and explicit stale-read coverage.
- Added 24-hour shared prayer calculation caching at rounded coordinates while preserving separate per-user database rows.
- Added standard 429 envelopes and `Retry-After` headers for registration, reset, resend, and 120/minute authenticated API traffic.
- Integrated opt-in Sentry SDKs, private frontend source maps, ID-only user context, and request/credential scrubbing.
- Added `RELIABILITY.md` and a disposable-account concurrency smoke script; deployed load and Sentry receipt checks await real hosting/DSNs.
- Confirmed production templates and Render Blueprint set `APP_DEBUG=false`; cleared accumulated local runtime logs.
# Phase I handoff (copy-ready)

Phase I is complete locally: backend controllers were restored to the FormRequest/Service/Resource architecture, schedule CRUD and account flows were separated into services, frontend checklist persistence moved into a tested hook, and current API/contribution documentation replaced stale scaffolding. Backend coverage increased from 50 to 54 tests (388 assertions), and a new frontend Vitest suite adds 7 tests for day-group creation, persisted checklist toggles/rollback, and live/overnight time logic. `php artisan test`, `npm run test`, and `npm run build` pass. Composer audit is clean after updating `league/commonmark` to 2.9.0; npm has no high/critical findings, with one moderate React Router redirect advisory mitigated by fixed internal navigation targets.
# Phase K handoff (copy-ready)

Phase K is implemented and verified locally with first-party analytics stored in Daycraft's own PostgreSQL database. It collects allow-listed pageviews and aggregate signup, activation, checklist, deletion, and notification-permission events without user IDs, email, free text, location, IP, user agent, cookies, or third-party pixels. Server-side events fire only after successful state changes; UUID/HMAC deduplication prevents retry duplicates. A backend-gated report is available at `/internal/analytics` after setting `ANALYTICS_ADMIN_EMAILS`. Backend: 58 tests / 424 assertions. Frontend: 10 tests. `php artisan test`, `npm run test`, and `npm run build` pass. Production still requires deploying the migration and setting `ANALYTICS_ENABLED=true` plus `ANALYTICS_ADMIN_EMAILS`; live dashboard receipt cannot be claimed until that deployment is performed.
