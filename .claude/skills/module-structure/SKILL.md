---
name: module-structure
description: Folder layout of a NestJS module in ludora-backend - DTOs split into input/output, services/ and controllers/ subfolders as soon as there are two, location of mappers, guards, pipes and tests. Use when creating a module, adding a file to a module, or deciding where a file belongs.
---

# Module structure

## Reference tree

```
src/<module>/
├── <module>.module.ts
├── controllers/                  # from 2 controllers (otherwise <module>.controller.ts at the root)
│   ├── <module>.controller.ts
│   └── <module>-<sub>.controller.ts
├── services/                     # from 2 services (otherwise <module>.service.ts at the root)
│   ├── <module>.service.ts
│   └── <module>-<sub>.service.ts
├── dto/
│   ├── input/                    # what the client sends (body, query)
│   │   ├── create-<entity>.dto.ts
│   │   ├── update-<entity>.dto.ts
│   │   └── <entity>-filter.dto.ts
│   └── output/                   # what the API returns
│       ├── <entity>-response.dto.ts
│       └── <entity>-collection-response.dto.ts
├── mappers/<entity>.mapper.ts
├── guards/<rule>.guard.ts
├── pipes/<entity>.pipe.ts
├── constants/<module>.constants.ts
└── interfaces/<entity>-interface.ts
```

Only create the folders you need. Real examples: `src/sessions/` (4 controllers, 4 services) and `src/conversations/` (1 controller at the root, 3 services in `services/`).

## Rules

### Input / output pair
- Every DTO goes in `dto/input/` or `dto/output/`, never directly in `dto/`.
- `input/`: classes validated by `class-validator` (`CreateXDto`, `UpdateXDto`, `XFilterDto`).
- `output/`: Swagger response classes (`XResponseData`, `XResponseDto`, `XCollectionItemDto`, `PaginatedXCollectionResponseDto`).
- Shared error and generic DTOs live in `src/shared/dto/` (`errors/`, `responses/`, `input/base-filter.dto.ts`).

### services/ and controllers/ subfolders
- With 1 service: `src/<module>/<module>.service.ts`.
- As soon as a 2nd service appears: create `services/`, move **both** into it and update the imports (module, controllers, tests).
- Same rule for controllers, independently of services.
- An admin controller follows the same pattern: `<module>-admin.controller.ts` (e.g. `src/fields/controllers/fields-admin.controller.ts`).

### Naming
- Kebab-case file names with a role suffix: `.controller.ts`, `.service.ts`, `.dto.ts`, `.mapper.ts`, `.guard.ts`, `.pipe.ts`.
- PascalCase class names with the same suffix: `SessionPlayersService`, `SessionMapper`, `ConversationMembershipGuard`.

### Shared code
Code used by several modules goes in `src/shared/` (`decorators/`, `guards/`, `mappers/`, `utils/`, `constants/`). A guard or pipe specific to an entity stays in its module, even if imported elsewhere (e.g. `SessionsPipe` used by `ratings`).

### Tests
Tests live in `tests/`, mirroring `src/`:

```
src/sessions/services/sessions.service.ts
tests/sessions/services/sessions.service.spec.ts

src/conversations/guards/conversation-membership.guard.ts
tests/conversations/guards/conversation-membership.guard.spec.ts
```

When moving a file into `services/` or `controllers/`, move its test too.
