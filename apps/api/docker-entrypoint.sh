#!/bin/sh
set -eu

cd "$(dirname "$0")"
./node_modules/.bin/prisma migrate deploy

case "${APP_ENV:-}" in
  development|test)
    SEED_SCOPE=learning-tracks node dist/prisma/seed.js
    ;;
  staging|production)
    ;;
  *)
    echo "APP_ENV must be development, test, staging, or production." >&2
    exit 1
    ;;
esac

exec node dist/src/main.js
