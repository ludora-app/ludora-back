# Open a shell in the dev container
dev-sh:
		docker compose -f compose.dev.yml exec ludora-api /bin/sh

# Start containers in dev mode
dev-up:
	docker compose -f compose.dev.yml --env-file .env.dev up --build

# Stop dev containers
dev-down:
	docker compose -f compose.dev.yml --env-file .env.dev down

# Reset PostgreSQL (remove volume and rebuild)
dev-postgres-reset:
	docker compose -f compose.dev.yml --env-file .env.dev down -v
	docker compose -f compose.dev.yml --env-file .env.dev up --build ludora-db

# Stop PostgreSQL only
dev-postgres-down:
	docker compose -f compose.dev.yml --env-file .env.dev down ludora-db

# Start PostgreSQL only
dev-postgres-up:
	docker compose -f compose.dev.yml --env-file .env.dev up ludora-db

# Run load tests
dev-k6:
	docker compose -f compose.dev.yml run --rm ludora-k6 run /scripts/auth/auth-load-test.js
