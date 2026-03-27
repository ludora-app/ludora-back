#!/bin/sh
set -e

# Apply DB migrations
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma migrate deploy

# Seed admin accounts
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- pnpm exec seed:admin

# Start the application
exec /usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/src/main.js
