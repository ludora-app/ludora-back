#!/bin/sh
set -e

# # Run database migrations before starting the app
# echo "Running database migrations..."
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma migrate deploy

# Authentification + lancement en une seule commande (using dev Vault)
exec /usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/src/main.js
