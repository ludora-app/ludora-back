#!/bin/sh
set -e

# Source le script pour exporter VAULT_TOKEN
. /usr/local/bin/vault-auth.sh

pnpm prisma generate

envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma db push --force-reset 

envconsul -config=/etc/envconsul/config.hcl -once -- pnpm run seed

exec envconsul -config=/etc/envconsul/config.hcl -- pnpm exec nest start --watch --preserveWatchOutput
