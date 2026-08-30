# Daycraft

**Craft your day, one routine at a time.**

Daycraft is a calm, beautifully designed daily routine planner — build your own schedule, track your streaks, and stay on top of what matters, one day at a time.

## Product

Daycraft helps anyone shape a practical weekly rhythm, follow today’s plan, and keep daily habits visible without turning planning into another source of noise.

Current capabilities include:

- User-owned day groups assigned to any combination of weekdays.
- A guided first-routine builder and live “happening now” view.
- Daily checklists with progress saved per calendar date.
- Editable schedule blocks and checklist labels.
- Optional browser reminders and location-aware time information.
- Account-backed sync through a Laravel API.
- Email verification, secure password recovery, and additive Google sign-in.
- Public Privacy Policy and Terms pages, consent timestamps, and permanent account deletion.
- Responsive, keyboard-accessible UI with reduced-motion support.
- First-party aggregate analytics without cookies, advertising IDs, or user content.

## Technology

- Frontend: Vite, React, Tailwind CSS, Framer Motion and Zustand.
- Backend: Laravel, PostgreSQL and Sanctum bearer-token authentication.
- API documentation: [`backend/API.md`](backend/API.md).

## Local development

Requirements: Node.js, PHP, Composer and PostgreSQL.

```bash
npm install
composer install --working-dir=backend
cp backend/.env.example backend/.env
php backend/artisan key:generate
php backend/artisan migrate
npm run dev
```

Development URLs:

- Daycraft frontend: `http://127.0.0.1:5173`
- Daycraft API: `http://127.0.0.1:8000/api/v1`

Production build:

```bash
npm run build
```

Frontend regression tests:

```bash
npm run test
```

Environment selection requires no code edits:

- Local frontend: copy `.env.example` to `.env`; it points to
  `http://127.0.0.1:8000/api/v1`.
- Production frontend: set `VITE_API_URL` in Vercel to the Render API.
- Local backend: copy `backend/.env.example` to `backend/.env`.
- Production backend: set the values shown in
  `backend/.env.production.example` in Render; never upload an `.env` file.

Local mail uses Laravel’s `log` driver. Production uses Resend's HTTPS mail
transport because Render's free service blocks SMTP. See
[`DEPLOYMENT.md`](DEPLOYMENT.md) for the full Vercel + Render procedure, Google
callback values, email setup, limitations, and future-domain checklist.

Scalability safeguards, cache/rate-limit decisions, Sentry setup, uptime
monitoring, reminder architecture limits, and the repeatable load-smoke script
are documented in [`RELIABILITY.md`](RELIABILITY.md).

Set `ANALYTICS_ENABLED=true` to collect first-party aggregate events. Set
`ANALYTICS_ADMIN_EMAILS` to a comma-separated list of accounts allowed to open
`/internal/analytics`; this list controls access only and is never written into
analytics events.

## Design system

- Canvas: cream `#F5EDE6`.
- Card tones: ink `#1A1A1A`, white `#FFFFFF`, and taupe `#8A8378`.
- Category accents: teal (Career), sage (Health), rose (Language), warm gray (Life) and dusty blue (Rest).
- Standalone notice accent: amber `#C9A227`, used by the offline and email-verification banners. It is not a category color.
- Typography: Caveat for expressive display headings and Poppins for interface copy.

`src/config/categories.js` is the single source of truth for category labels and
accents; `CATEGORY_KEYS` drives every picker so the two cannot drift.

## Project structure

```text
src/                    React application
public/                 public metadata and brand placeholders
backend/app/            Laravel application code
backend/database/       user-owned schema migrations (no schedule seed data)
backend/routes/api.php  versioned API routes
backend/API.md           API reference
DEPLOYMENT.md            free-tier preview deployment and operations guide
RELIABILITY.md           caching, monitoring, rate limits and load checks
CONTRIBUTING.md          architecture rules and verification workflow
```

## Architecture

Laravel endpoints use a Controller → FormRequest → Service → Model → Resource pipeline and a shared JSON envelope. React pages compose feature components; reusable server-state and interaction behavior lives in hooks, global authentication lives in Zustand, and HTTP access stays in `src/api/`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before adding endpoints or user flows.

## Deployment status

Vercel and Render configuration is present, but no live URL has been verified from this workspace. Set `VITE_API_URL`, `APP_URL`, and `FRONTEND_URL` to the platform-provided HTTPS URLs, then replace example sitemap and Open Graph origins. Placeholder hosts must not be represented as production.

## Product roadmap boundaries

Phase B replaced the global fixed schedule with authenticated, user-owned day groups and direct CRUD. New accounts intentionally start empty and build their own recurring routines.
