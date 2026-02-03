#!/bin/sh
set -e

# Source le script pour exporter VAULT_TOKEN
. /usr/local/bin/vault-auth.sh

pnpm prisma generate

# Run migrations in non-interactive mode for Docker
envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma migrate deploy

# envconsul -config=/etc/envconsul/config.hcl -once -- pnpm run seed

exec envconsul -config=/etc/envconsul/config.hcl -- pnpm exec nest start --watch --preserveWatchOutput
