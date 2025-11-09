# Open a shell in the dev container
dev-sh:
		docker compose -f compose.dev.yml exec ludora-api /bin/sh

# Start containers in dev mode
dev-up:
	docker compose -f compose.dev.yml --env-file .env.dev up --build

# Stop dev containers
dev-down:
	docker compose -f compose.dev.yml --env-file .env.dev down

# Run load tests
dev-k6:
	docker compose -f compose.dev.yml run --rm ludora-k6 run /scripts/auth/auth-load-test.js
