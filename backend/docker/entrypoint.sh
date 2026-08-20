#!/bin/sh
set -eu

port="${PORT:-10000}"
sed -ri "s/^Listen [0-9]+$/Listen ${port}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${port}>/" /etc/apache2/sites-available/000-default.conf

# Remove any image-layer or previous-release cache before rebuilding it from
# Render's current environment variables.
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan migrate --force

exec "$@"
