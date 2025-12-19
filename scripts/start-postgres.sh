#!/bin/sh
set -e

# Authentification + lancement PostgreSQL en une seule commande
exec /usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- docker-entrypoint.sh postgres
