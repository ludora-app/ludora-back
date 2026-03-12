#!/bin/sh
set -e

echo "Running database migrations..."
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma migrate deploy

exec /usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/src/main.js
