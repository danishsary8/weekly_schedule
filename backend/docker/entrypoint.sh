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
echo "[daycraft] DB_CONNECTION=${DB_CONNECTION:-UNSET (Laravel will default to sqlite)}"

echo "[daycraft] caching configuration and routes"
php artisan config:clear
php artisan config:cache
php artisan route:cache

# Bound how long libpq waits on a host that does not resolve. Without this a
# deleted database makes every connection attempt hang for minutes.
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"

echo "[daycraft] running migrations"
if php artisan migrate --force --no-interaction; then
    echo "[daycraft] migrations up to date"
else
    migrate_status=$?
    echo "[daycraft] MIGRATIONS FAILED (exit ${migrate_status})." >&2
    echo "[daycraft] Starting the web server anyway so the service stays reachable and this log survives." >&2
    echo "[daycraft] Check that the database exists and that DB_URL / DB_CONNECTION point at it, then redeploy." >&2
fi

echo "[daycraft] starting web server on port ${port}"
exec "$@"
