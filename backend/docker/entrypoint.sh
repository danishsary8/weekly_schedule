#!/bin/sh
set -eu

# ---------------------------------------------------------------------------
# Container start-up.
#
# Ordering rule: the web server must start even when the database is
# unreachable. An earlier version ran migrations as a hard gate before
# `exec "$@"`, so a database whose host had stopped resolving produced a
# container that never bound a port. Render's only symptom was
# "No open ports detected", the URL hung with no response at all, and the real
# error was buried above that line in the log.
#
# Migrations are therefore attempted, reported, and allowed to fail. A schema
# that is behind will still throw on data endpoints — but /api/v1/health answers,
# the log is reachable, and the failure names itself.
# ---------------------------------------------------------------------------

port="${PORT:-10000}"
sed -ri "s/^Listen [0-9]+$/Listen ${port}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${port}>/" /etc/apache2/sites-available/000-default.conf

# Name the connection Laravel will actually use. Unset means Laravel falls back
# to `sqlite`, which is how a Postgres failure can report itself as
# "(Connection: sqlite, Host: dpg-...)" — confusing enough to hide the cause.
echo "[loomora] DB_CONNECTION=${DB_CONNECTION:-UNSET (Laravel will default to sqlite)}"

echo "[loomora] caching configuration and routes"
php artisan config:clear
php artisan config:cache
php artisan route:cache

# Bound how long libpq waits on a host that does not resolve. Without this a
# deleted database makes every connection attempt hang for minutes. 20s rather
# than 10s: a serverless Postgres that has scaled to zero needs a moment to
# accept its first connection, and giving up early looks identical to a database
# that does not exist.
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-20}"

# Retry migrations rather than accepting the first refusal.
#
# The database is serverless (Neon) and suspends its compute after a period of
# inactivity. A deploy is very often the first traffic it has seen in hours, so
# attempt one can fail purely because the database is still waking up — and a
# skipped migration leaves the API running against a schema-less database, which
# answers `select 1` happily while every real query 500s. That combination is
# genuinely confusing to debug, so it is worth a few seconds here to avoid.
echo "[loomora] running migrations"
migrate_ok=0
attempt=1
attempts=3

while [ "$attempt" -le "$attempts" ]; do
    if php artisan migrate --force --no-interaction; then
        migrate_ok=1
        break
    fi

    echo "[loomora] migration attempt ${attempt} of ${attempts} failed" >&2
    attempt=$((attempt + 1))

    # Guarded rather than `[ ... ] && sleep`, which would return non-zero on the
    # final pass and terminate the script under `set -e`.
    if [ "$attempt" -le "$attempts" ]; then
        echo "[loomora] waiting 5s for the database to wake" >&2
        sleep 5
    fi
done

if [ "$migrate_ok" -eq 1 ]; then
    echo "[loomora] migrations up to date"
else
    echo "[loomora] MIGRATIONS FAILED after ${attempts} attempts." >&2
    echo "[loomora] Starting the web server anyway so the service stays reachable and this log survives." >&2
    echo "[loomora] The API will answer /api/v1/health but every data endpoint will return 500 until the schema exists." >&2
    echo "[loomora] Check that the database exists and that DB_URL / DB_CONNECTION point at it, then redeploy." >&2
fi

echo "[loomora] starting web server on port ${port}"
exec "$@"
