vault {
  # L'adresse Vault vient de la variable d'environnement VAULT_ADDR
  # Le token vient de VAULT_TOKEN
  ssl {
    enabled = true
    verify  = true
  }
}

secret {
  path      = "secret/ludora/ludora-backend/staging"
  no_prefix = true
}

