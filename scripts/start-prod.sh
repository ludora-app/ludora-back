#!/bin/sh
set -e

# Authentification + lancement en une seule commande
exec /usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/src/main.js
