---
name: code-quality
description: Code quality in ludora-backend - strict TypeScript without any, Biome lint and format, Jest tests in tests/, NestJS best practices (thin controllers, dependency injection, Prisma select), PinoLogger logging (debug in services, warn/error before every throw). Use for any TypeScript code written or changed in the backend.
---

# Code quality

## 1. TypeScript

- **No `any`.** The Biome rule `noExplicitAny` is disabled, but `any` is still forbidden by convention. Alternatives:
  - Prisma generated types (`Sessions`, `Prisma.SessionsWhereInput`, `Prisma.SessionsGetPayload<…>`)
  - a dedicated interface (`RawSessionCollectionItem` in the mapper)
  - `unknown` + a type guard for truly unknown data
- Explicitly type the return of public service and controller methods (`Promise<ResponseTypeDto<X>>`).
- Avoid the non-null assertion `!` (Biome warning): check and throw an exception instead.
- `const` by default, no unused variables or imports (Biome errors).
- Domain enums come from `src/shared/constants/constants.ts` or `generated/prisma/enums`, not hard-coded strings.

## 2. Lint, format, tests

Before considering a task done:

```bash
pnpm check        # biome check --write (lint + format)
pnpm test         # jest
pnpm build        # checks compilation
```

- Style: 2 spaces, single quotes, semicolons, trailing commas, 100 columns (`biome.json`).
- Every new service, guard, pipe or mapper has its test in `tests/<module>/…/<file>.spec.ts` (see the `module-structure` skill).
- Unit tests with `@nestjs/testing`: `Test.createTestingModule`, with `PrismaService` and dependencies mocked.
- Cover the happy path **and** every branch that throws.

## 3. NestJS best practices

- **Thin controllers**: read the request, call the service, build `{ data, message }`. No business logic or Prisma query in a controller.
- **Services**: all business logic and data access through the injected `PrismaService`.
- **Dependency injection** through the constructor, as `private readonly`. Never `new` a service.
- **Nest HTTP exceptions** (`NotFoundException`, `BadRequestException`, `ForbiddenException`, `ConflictException`…) with a clear English message.
- **Prisma**:
  - `select` only the fields you need rather than `include`
  - `Promise.all` for independent queries (e.g. `findMany` + `count`)
  - `this.prisma.$transaction` for writes that must succeed or fail together
- **Validation** goes through input DTOs and the global `ValidationPipe`. Don't re-validate by hand what `class-validator` already covers.
- **Configuration** through `ConfigService`, not `process.env` in services.
- Rate limiting with `@Throttle` on sensitive or expensive routes.
- Repeated checks → guard or pipe (`access-control` skill). Response format → `api-contract` skill.

## 4. Logging

The project uses `nestjs-pino`. In every service:

```ts
constructor(
  private readonly prisma: PrismaService,
  private readonly logger: PinoLogger,
) {
  this.logger.setContext(SessionsService.name);
}
```

### Rules
- **Before every `throw`**, log at the right level with useful context (uids, received values):
  - `this.logger.warn(...)` for an expected client-side error (missing resource, access denied, invalid input)
  - `this.logger.error(...)` for an unexpected or server error (external service failure, inconsistent state, caught exception)
- **Generous `debug` logs** in services: entry of important methods with their key parameters, decision steps, results (item count, created uid).
- Never log secrets or sensitive data: passwords, tokens, verification codes, banking data.
- Messages in English, with identifiers in the message.

```ts
async create(dto: CreateSessionDto): Promise<Sessions> {
  this.logger.debug(`Creating session on field ${dto.fieldUid} for user ${dto.userUid}`);

  const field = await this.fieldsService.findOne(dto.fieldUid);
  if (!field) {
    this.logger.warn(`Field not found: ${dto.fieldUid}`);
    throw new NotFoundException('Field not found');
  }

  try {
    const session = await this.prisma.sessions.create({ data: { /* ... */ } });
    this.logger.debug(`Session created: ${session.uid}`);
    return session;
  } catch (error) {
    this.logger.error(`Failed to create session on field ${dto.fieldUid}: ${error}`);
    throw new InternalServerErrorException('Failed to create session');
  }
}
```
