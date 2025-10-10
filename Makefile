dev-sh:
		docker compose -f compose.dev.yml exec ludora-api /bin/sh

dev-up:
	docker compose -f compose.dev.yml --env-file .env.dev up --build

dev-down:
	docker compose -f compose.dev.yml --env-file .env.dev down

