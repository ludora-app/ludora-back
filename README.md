# Ludora Backend

Backend API for the Ludora application, built with **NestJS**, **Prisma**, and **PostgreSQL**.

## Technologies

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: PostgreSQL (with PostGIS)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: JWT, Passport, Argon2, Google OAuth
- **Documentation**: Swagger (OpenAPI)
- **Monitoring**: Prometheus, Grafana
- **Testing**: Jest, k6 (load testing)
- **Package Manager**: pnpm

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker](https://www.docker.com/) & Docker Compose
- [Doppler CLI](https://docs.doppler.com/docs/install-cli) (for secret management)

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
   This project uses **Doppler** for secret management.
   ```bash
   doppler login
   doppler setup
   ```
   Ensure you have access to the `ludora-backend` project in Doppler.

## Running the Application

### Local Development

To start the application in development mode with hot-reload:

```bash
# Start required services (DB, etc.) if not running locally
pnpm docker:dev

# Run the API
pnpm start:dev
```

The API will be available at `http://localhost:2424`.
Swagger documentation is available at `http://localhost:2424/swagger`.

### Docker Environment

You can run the full stack (API + DB + Monitoring) using Docker Compose:

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

- **Grafana**: `https://grafana.gana-f4ll.fr` (via Traefik) or check `compose.dev.yml` port mappings.
- **Prometheus**: `https://prometheus.gana-f4ll.fr`

## Project Structure

- `src/`: Source code
  - `auth-b2b/`, `auth-b2c/`: Authentication modules
  - `users/`: User management
  - `sessions/`: Game session management
  - `payment/`: Payment processing (Stripe)
  - `metrics/`: Application metrics
- `prisma/`: Database schema and migrations
- `docker/`: Dockerfiles for different environments
- `tests/`: E2E and unit tests
- `load-tests/`: k6 load testing scripts

## License

UNLICENSED

## Author

**Gana Fall**

- Website: [gana-f4ll.fr](https://ganaf4ll.github.io/portfolio/)
- GitHub: [@ganaf4ll](https://github.com/GanaF4ll)
