#!/bin/sh
set -e

echo "Resolving any failed migrations..."
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma migrate resolve --rolled-back "04_alter_on_delete_user_cascades" || true

echo "Running database migrations..."
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma migrate deploy

exec /usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/src/main.js
