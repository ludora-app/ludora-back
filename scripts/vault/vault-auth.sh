#!/bin/sh
# Script d'authentification Vault AppRole
# 
# Usage:
#   Mode wrapper:  vault-auth.sh <command> [args...]
#   Mode source:   . vault-auth.sh  (exporte juste VAULT_TOKEN)

set -e

if [ -z "$VAULT_ADDR" ] || [ -z "$VAULT_ROLE_ID" ] || [ -z "$VAULT_SECRET_ID" ]; then
  echo "❌ Variables manquantes: VAULT_ADDR, VAULT_ROLE_ID, VAULT_SECRET_ID"
  exit 1
fi


VAULT_RESPONSE=$(curl -s --request POST \
  --data "{\"role_id\":\"$VAULT_ROLE_ID\",\"secret_id\":\"$VAULT_SECRET_ID\"}" \
  "$VAULT_ADDR/v1/auth/approle/login")

VAULT_TOKEN=$(echo "$VAULT_RESPONSE" | grep -o '"client_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$VAULT_TOKEN" ]; then
  echo "❌ Échec de l'authentification Vault"
  echo "   Réponse: $VAULT_RESPONSE"
  exit 1
fi

export VAULT_TOKEN

# Si des arguments sont passés, exécuter la commande (mode wrapper)
# Sinon, le script est sourcé et VAULT_TOKEN est exporté (mode source)
if [ $# -gt 0 ]; then
  exec "$@"
fi
