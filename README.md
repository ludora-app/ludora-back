# Ludora Backend

Backend API for the Ludora application, built with **NestJS**, **Prisma**, and **PostgreSQL**.

## Technologies

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: PostgreSQL (with PostGIS)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: JWT, Passport, Argon2, Google OAuth, Apple Sign-in
- **Documentation**: Swagger (OpenAPI)
- **Testing**: Jest, k6 (load testing)
- **Package Manager**: pnpm
- **Secret Management**: HashiCorp Vault & Envconsul

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker](https://www.docker.com/) & Docker Compose
- [Vault CLI](https://developer.hashicorp.com/vault/docs/install) (optional, for local secret management)

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd ludora-backend
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Setup Environment Variables:**
   This project uses **HashiCorp Vault** and **Envconsul** for secret management.
   Copy the example file to `.env.local` and fill in the Vault AppRole credentials:
   ```bash
   cp .env.local.example .env.local
   ```
   Ensure you have configured `VAULT_ADDR`, `VAULT_ROLE_ID`, and `VAULT_SECRET_ID`.

## Running the Application

### Local Development

To start the application in development mode with hot-reload:

```bash
# Start required services (DB, etc.) and run the API locally inside Docker
docker compose -f docker/compose.local.yml --env-file .env.local up --build
```

The API will be available at `http://localhost:2424`.
Swagger documentation is available at `http://localhost:2424/swagger`.

### Docker Environment

You can run the environment using Docker Compose:

```bash
# Start development environment
pnpm docker:dev

# Build and start
pnpm docker:dev:build

# Stop environment
pnpm docker:dev:down
```

## Database Management

We use **Prisma** for database schema management.

```bash
# Generate Prisma Client
pnpm generate

# Run migrations (dev)
pnpm migrate:dev

# Reset database
pnpm migrate:reset

# Open Prisma Studio (GUI)
pnpm studio
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## Monitoring

When running via Docker Compose (`pnpm docker:dev`), the following services are available:

- **Grafana**: `https://grafana.gana-f4ll.fr` (via Traefik) or check `docker/compose.dev.yml` port mappings.
- **Prometheus**: `https://prometheus.gana-f4ll.fr`

## Project Structure

- `src/`: Source code
  - `auth/`: Authentication modules (B2B & B2C)
  - `users/`: User management
  - `sessions/`: Game session management and matchmaking suggestions
  - `payment/`: Payment processing (Stripe)
  - `metrics/`: Application metrics
  - `chat/`: Real-time chat WebSocket gateway
  - `conversations/`: Chat messages and conversation management
- `prisma/`: Database schema (modular schema files under `schema/`) and migrations
- `docker/`: Dockerfiles for different environments (local, dev, staging, prod)
- `tests/`: E2E and unit tests
- `load-tests/`: k6 load testing scripts

## License

UNLICENSED

## Author

**Gana Fall**

- Website: [gana-f4ll.fr](https://ganaf4ll.github.io/portfolio/)
- GitHub: [@ganaf4ll](https://github.com/GanaF4ll)
