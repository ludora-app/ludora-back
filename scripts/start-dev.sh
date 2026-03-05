#!/bin/sh
set -e

# # Run database migrations before starting the app
echo "Resolving any failed migrations..."
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma migrate resolve --rolled-back "04_alter_on_delete_user_cascades" || true

# Authentification + lancement en une seule commande (using dev Vault)
exec /usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/src/main.js
