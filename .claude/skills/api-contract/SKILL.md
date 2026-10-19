---
name: api-contract
description: ludora-backend API contract conventions - response envelope (ResponseTypeDto / PaginationResponseTypeDto), collection endpoints with "list/collection" in the URL, mapper classes to flatten Prisma objects, mandatory Swagger documentation on DTOs and endpoints. Use whenever creating or changing an endpoint, an output DTO or a mapper.
---

# API contract

Everything the client receives follows the same rules: a standard response envelope, flat objects produced by a mapper, and complete Swagger documentation.

## 1. Response envelope

Every endpoint returns `{ data, message }`. Shared types live in `src/shared/dto/responses/`:

| Case | Controller return type | Swagger type |
|---|---|---|
| Single resource | `ResponseTypeDto<XResponseData>` | `XResponseDto extends ResponseTypeDto<XResponseData>` |
| Collection | `PaginationResponseTypeDto<XCollectionItemDto>` | `toPaginationResponseType(XCollectionItemDto)` |
| Action without data | `SuccessTypeDto` | `SuccessTypeDto` |

Single resource (`src/sessions/dto/output/session-response.dto.ts`):

```ts
export class SessionResponseData {
  @ApiProperty({ description: 'Session ID', example: 'cmaistjrg001yob7oe0mqu3ws', readOnly: true })
  uid: string;
  // ...
}

export class SessionResponseDto extends ResponseTypeDto<SessionResponseData> {
  @ApiProperty({ type: SessionResponseData })
  readonly data: SessionResponseData;
}
```

## 2. Collections

### URL
An endpoint returning a collection **must** contain `collection` in its URL, preceded by a `list` segment:

```ts
@Get('list/collection')                        // ✅
@Get('my-list/collection')                     // ✅
@Get('list-by-session/collection/:sessionUid') // ✅
@Get('list-blocked-users')                     // ❌ missing /collection
@Get('my-list')                                // ❌
```

### Cursor pagination
- The filter DTO extends `BaseFilterDto` (`limit` 1-50, `cursor`).
- The service returns a `PaginatedDataDto<T>`: `{ items, nextCursor, totalCount }`.
- Technique: `take: limit + 1`; if more than `limit` rows come back, `pop()` the last one and use its `uid` as `nextCursor`. Always add `{ uid: 'asc' }` as the last `orderBy` for stable pagination.

```ts
const [sessions, totalCount] = await Promise.all([
  this.prisma.sessions.findMany({
    cursor: cursor ? { uid: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: limit + 1,
    orderBy,
    select: { /* only the fields you need */ },
    where,
  }),
  this.prisma.sessions.count({ where }),
]);

let nextCursor: string | null = null;
if (sessions.length > limit) {
  nextCursor = sessions.pop()?.uid ?? null;
}

return { items: SessionMapper.fromRawToSessionResponses(sessions, new Map()), nextCursor, totalCount };
```

### Collection DTO
In `dto/output/x-collection-response.dto.ts`: an `XCollectionItemDto` (often `OmitType(XResponseData, [...])` plus flattened fields) and the Swagger constant:

```ts
export const PaginatedSessionCollectionResponseDto =
  toPaginationResponseType(SessionCollectionItemDto);
```

### Controller

```ts
@Get('list/collection')
@ApiOkResponse({ type: PaginatedSessionCollectionResponseDto })
async findAll(@Query() filter: SessionFilterDto): Promise<PaginationResponseTypeDto<SessionCollectionItemDto>> {
  const sessions = await this.sessionsService.findAll(filter);
  return {
    data: { items: sessions.items, nextCursor: sessions.nextCursor, totalCount: sessions.totalCount },
    message: 'Sessions fetched successfully',
  };
}
```

## 3. Mapper classes

**Never** return a raw Prisma result with its nested relations (`field.fieldImages[0].url`, `_count.sessionPlayers`...). A mapper turns raw data into a flat DTO.

- Location: `src/<module>/mappers/<entity>.mapper.ts`, class `XMapper` with `static` methods.
- Declare a `RawX...` interface that describes exactly the Prisma `select` used (no `any`).
- Name methods after their target: `toDto`, `toFindOneDto`, `fromRawToCollectionItem`, plus a list version (`toDtoList`, `fromRawToXResponses`).
- Flatten relations with a prefix: `field.latitude` → `fieldLatitude`, `field.shortAddress` → `fieldShortAddress`.
- Cast Prisma types to domain enums here (`session.sport as Sport`), not in the controller.
- Reuse mappers of related entities (`SessionTeamMapper.toDtoList(...)`).

Reference: `src/sessions/mappers/session.mapper.ts`.

```ts
export interface RawSessionCollectionItem {
  uid: string;
  sport: string;
  field: { latitude: number; shortAddress: string; fieldImages: { url: string }[] };
  sessionTeams: { teamName: string; _count: { sessionPlayers: number } }[];
}

export class SessionMapper {
  static fromRawToCollectionItem(session: RawSessionCollectionItem): SessionCollectionItemDto {
    const { field, sessionTeams } = session;
    return {
      uid: session.uid,
      sport: session.sport as Sport,
      fieldImage: field.fieldImages[0]?.url,
      fieldLatitude: field.latitude,
      fieldShortAddress: field.shortAddress,
      sessionTeams: sessionTeams.map((team) => ({
        numberOfPlayers: team._count.sessionPlayers,
        teamName: team.teamName,
      })),
    };
  }
}
```

## 4. Mandatory Swagger

### DTOs
- Every property (input **and** output) has an `@ApiProperty` with `description` and `example`.
- Optional fields: `required: false`. Output fields: `readOnly: true`.
- Arrays and nested objects: set `type: [SubDto]` or `type: SubDto`.
- Enums: `enum: MyEnum` + `example: MyEnum.VALUE`.
- Input DTOs keep their `class-validator` decorators (global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`).
- Derive instead of duplicating: `OmitType`, `PickType`, `PartialType` from `@nestjs/swagger`.

### Endpoints
Every route declares:
- `@ApiOperation({ summary })`
- the typed success response (`@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiNoContentResponse`)
- **every** possible error response, using the DTOs in `src/shared/dto/errors/` (`BadRequestResponseDto`, `UnauthorizedResponseDto`, `ForbiddenResponseDto`, `NotFoundResponseDto`, `ConflictResponseDto`)
- an explicit `@HttpCode(HttpStatus.X)`

The controller carries `@ApiTags(SWAGGER_TAG_X)`. For a new module, add the tag and its description in `src/swagger/swagger.config.ts`.

## Checklist
- [ ] Return type `ResponseTypeDto<…>` / `PaginationResponseTypeDto<…>` with a `message`
- [ ] Collection → URL in `list…/collection`, filter extending `BaseFilterDto`
- [ ] Data goes through a mapper, no nested Prisma object returned
- [ ] `@ApiProperty` on every field, `@Api*Response` decorators for success and errors
