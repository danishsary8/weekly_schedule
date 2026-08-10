# Daycraft free-tier preview deployment

Daycraft is configured for a Vercel Hobby frontend and a Docker-based Render
backend with Render PostgreSQL. This is a **preview/hobby deployment**, not a
durable production platform: Render's free PostgreSQL database expires 30 days
after creation, has no backups, and is deleted after its upgrade grace period.

## Why these hosts

- **Vercel**: its Hobby tier fits a Vite static build, provides HTTPS and
  environment separation, and serves SPA routes through `vercel.json`.
- **Render**: it supports PHP through Docker, gives the API an HTTPS
  `onrender.com` URL, and provisions PostgreSQL from `render.yaml`. A free web
  service sleeps after 15 minutes idle and can take about a minute to wake.
- **Railway was not selected**: its free plan supplies only a small usage
  credit, whereas Render explicitly supports a free sleeping web service and a
  temporary free managed database.

## 1. Source repository

Render and Vercel normally deploy from GitHub. This workspace is not currently
a Git repository, so create a private GitHub repository, initialize this folder,
and push it. Confirm that neither `.env` nor `backend/.env` is in the first
commit. The tracked templates contain placeholders only.

## 2. Deploy the backend to Render

1. Create a Render account and connect the GitHub repository.
2. Choose **New > Blueprint** and select the repository. Render reads the root
   `render.yaml`, creates `daycraft-api`, and provisions `daycraft-postgres`.
3. Supply every environment variable marked `sync: false`:
   - `APP_KEY`: generate with `php backend/artisan key:generate --show`.
   - `APP_URL`: the assigned URL, such as `https://daycraft-api.onrender.com`.
   - `FRONTEND_URL`: the final Vercel origin.
   - `CORS_ALLOWED_ORIGINS`: the same exact Vercel origin; never use `*`.
   - `SANCTUM_STATEFUL_DOMAINS`: Vercel hostname only, without `https://`.
   - Google and Resend values from the sections below.
   - `ANALYTICS_ENABLED=true` and `ANALYTICS_ADMIN_EMAILS=<your login email>` for the private aggregate report.
4. Deploy. The Docker entrypoint caches Laravel config/routes/views and runs
   `php artisan migrate --force`; it never runs a seeder. New users therefore
   start with zero day groups, timeline entries, and checklist items.
5. Verify `https://<render-host>/api/v1/health` returns successful JSON. A first
   request after idle can take about one minute.

Render injects PostgreSQL's internal connection string as `DB_URL`; it is never
stored in source control.

## 3. Deploy the frontend to Vercel

1. Create or sign in to Vercel and import the same GitHub repository.
2. Keep the repository root as project root. `vercel.json` sets the Vite build,
   `dist` output, and SPA fallback.
3. Add this Production environment variable:

   ```text
   VITE_API_URL=https://<render-host>/api/v1
   ```

4. Deploy, then set Render's `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and
   `SANCTUM_STATEFUL_DOMAINS` to the assigned Vercel host and redeploy the API.
5. Refresh `/privacy`, `/terms`, `/login`, and `/register` directly. Confirm the
   splash, fonts, SVG icon, and Google mark load without asset errors.

Local development continues to use:

```text
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

No source change is needed when switching environments.

## 4. Google OAuth production configuration

In Google Cloud Console:

1. Open **APIs & Services > Credentials**.
2. Open the existing **OAuth 2.0 Client ID** of type **Web application**.
3. In **Authorized JavaScript origins**, retain local development and add:

   ```text
   https://<your-vercel-host>
   ```

4. In **Authorized redirect URIs**, retain the local callback and add exactly:

   ```text
   https://<your-render-host>/api/v1/auth/google/callback
   ```

5. Save. Set Render's `GOOGLE_REDIRECT_URI` to that identical callback plus the
   matching `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then redeploy.

Do not enter the Vercel `/auth/google/callback` route as Google's callback:
Google returns to Laravel first; Laravel validates state and sends a single-use
handoff code to the frontend.

## 5. Deliverable production email with Resend

Render free services block SMTP, so Daycraft uses the installed
`resend/resend-laravel` HTTPS transport.

1. Create a Resend account.
2. Add and verify a domain you own using the DNS records Resend supplies.
   Platform subdomains such as `vercel.app` and `onrender.com` cannot be used as
   your sender domain.
3. Create a Resend API key with sending permission.
4. On Render set:

   ```text
   MAIL_MAILER=resend
   RESEND_API_KEY=re_...
   MAIL_FROM_ADDRESS=hello@your-verified-domain.example
   MAIL_FROM_NAME=Daycraft
   ```

5. Redeploy and register a fresh account. Verification links are signed using
   `APP_URL`; verification completion and reset-password links use
   `FRONTEND_URL`. Confirm both emails contain HTTPS production hosts.

Generally deliverable public email cannot work until a sender domain is owned
and verified. A Resend account/API key alone is insufficient.

## 6. Production smoke test

Use a fresh email address:

1. Open the Vercel URL privately and register.
2. Open the verification email and verify the address.
3. Build a day group, assign today, and add a timeline and checklist item.
4. Edit the entry, refresh, and confirm persistence.
5. Log out and back in; confirm the schedule remains.
6. Complete Google sign-in with a separate address.
7. Complete password reset; confirm the old password and old token fail.
8. Confirm browser requests target Render over HTTPS with no CORS,
   mixed-content, asset, or JavaScript errors.

## 7. Future custom-domain swap

1. Add the frontend domain in Vercel and copy its requested `A`/`CNAME` records
   to DNS. Add an API subdomain in Render and copy Render's `CNAME`. Wait for TLS.
2. Change Vercel `VITE_API_URL` to `https://api.<domain>/api/v1` and redeploy.
3. On Render change `APP_URL`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`,
   `SANCTUM_STATEFUL_DOMAINS`, and `GOOGLE_REDIRECT_URI`; redeploy.
4. Add `https://<domain>` to Google's JavaScript origins and
   `https://api.<domain>/api/v1/auth/google/callback` to redirect URIs. Keep old
   values until the DNS transition is verified.
5. Verify the domain in Resend, update `MAIL_FROM_ADDRESS`, and publish Resend's
   SPF/DKIM and return-path DNS records.
6. Update `public/sitemap.xml`, canonical/OG URLs, and repeat the smoke test.

## Secret-handling checklist

- Runtime `.env` files are ignored; only example templates are tracked.
- PostgreSQL credentials come from Render's managed secret binding.
- `APP_KEY`, OAuth secret, Resend key, and sender settings exist only in hosting
  dashboards or ignored local files.
