# Open a shell in the dev container with Vault and envconsul authentication
local-sh:
		docker compose -f compose.local.yml exec ludora-api sh -c '. /usr/local/bin/vault-auth.sh && envconsul -config=/etc/envconsul/config.hcl -once -- sh'

# Start containers in dev mode
local-up:
	docker compose -f compose.local.yml --env-file .env.local up --build

# Stop dev containers
local-down:
	docker compose -f compose.local.yml --env-file .env.local down

# Reset PostgreSQL (remove volume and rebuild)
local-postgres-reset:
	docker compose -f compose.local.yml --env-file .env.local down -v
	docker compose -f compose.local.yml --env-file .env.local up --build ludora-db

# Stop PostgreSQL only
local-postgres-down:
	docker compose -f compose.local.yml --env-file .env.local down ludora-db

# Start PostgreSQL only
local-postgres-up:
	docker compose -f compose.local.yml --env-file .env.local up ludora-db

# Run load tests
local-k6:
	docker compose -f compose.local.yml run --rm ludora-k6 run /scripts/auth/auth-load-test.js

dev-up:
	docker compose -f compose.dev.yml --env-file .env.local up --build