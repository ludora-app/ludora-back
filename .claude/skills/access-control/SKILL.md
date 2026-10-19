---
name: access-control
description: Request security and checks in ludora-backend - endpoints authenticated by default (AuthB2CGuard + @Protected, @Public only when explicitly requested), guards for recurring authorization checks (e.g. ConversationMembershipGuard), pipes for recurring existence checks (e.g. SessionsPipe). Use when creating a controller or an endpoint, or when the same check repeats across a module.
---

# Access control

## 1. Authentication by default

**Every endpoint is protected**, unless the user explicitly asks for it to be public.

- The auth guard is applied at controller level:
  - `@UseGuards(AuthB2CGuard)` for the mobile app (consumers)
  - `AuthB2BGuard` for partners, `AdminGuard` for the admin dashboard
- Every protected route has `@Protected()` (Swagger `JWT-auth` lock) and documents `@ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })`.
- `@Public()` (`src/shared/decorators/public.decorator.ts`) disables the guard for a route. **Never add it on your own initiative.** When in doubt, ask.
- Read the current user with `request['user'].uid`.

```ts
@ApiTags(SWAGGER_TAG_SESSIONS)
@Controller('sessions')
@UseGuards(AuthB2CGuard)
export class SessionsController {
  @Get('my-stats')
  @Protected()
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async getMyStats(@Req() request: Request) {
    const userUid = request['user'].uid;
    // ...
  }
}
```

## 2. Guard for recurring authorization checks

When several endpoints of a module perform the same **access-right** check ("is the user a member / creator / owner of X?"), move it out of the service into a guard.

Reference: `src/conversations/guards/conversation-membership.guard.ts`

```ts
@Injectable()
export class ConversationMembershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userUid = request.user?.uid;
    const conversationUid = request.params.uid || request.query.uid;

    if (!userUid || !conversationUid) throw new UnauthorizedException();

    const membership = await this.prisma.conversationMembers.findUnique({
      where: { conversationUid_userUid: { conversationUid, userUid } },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this conversation.');
    }

    request.membership = membership; // reusable in the handler
    return true;
  }
}
```

Usage, **after** the controller's auth guard:

```ts
@Get(':uid')
@UseGuards(ConversationMembershipGuard)
@Protected()
@ApiForbiddenResponse({ type: ForbiddenResponseDto })
```

Rules:
- File `src/<module>/guards/<rule>.guard.ts`.
- `UnauthorizedException` when the identity is missing, `ForbiddenException` when access is denied.
- Attach already-loaded data to `request` when the handler needs it, to avoid a second query.
- Add `@ApiForbiddenResponse` on the affected routes.
- Test in `tests/<module>/guards/`.

## 3. Pipe for recurring existence checks

When several endpoints load the same entity from a uid, check that it exists, **and** the service then needs many of its fields, create a pipe that turns the uid into the entity.

Reference: `src/sessions/pipes/sessions.pipe.ts`

```ts
@Injectable()
export class SessionsPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(sessionUid: string): Promise<Sessions> {
    const session = await this.prisma.sessions.findUnique({ where: { uid: sessionUid } });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }
}
```

Usage on `@Param` or `@Body`:

```ts
async findPlayers(@Param('sessionUid', SessionsPipe) session: Sessions) {
  return this.sessionPlayersService.findAll(session); // the service receives the full entity
}
```

Rules:
- File `src/<module>/pipes/<entity>.pipe.ts`.
- The pipe returns the Prisma-typed entity, not a boolean.
- Add `@ApiNotFoundResponse({ type: NotFoundResponseDto })` on the affected routes.
- Don't create a pipe if the service only needs the uid and runs its own query anyway.

## Guard or pipe?

| What is checked | Tool | Exception |
|---|---|---|
| Is the user allowed? | Guard | 401 / 403 |
| Does the resource exist (and is it needed afterwards)? | Pipe | 404 |
| One-off check, single endpoint | Stays in the service | depends |

Rule of thumb: once 2 or 3 endpoints repeat the same check, extract it.
