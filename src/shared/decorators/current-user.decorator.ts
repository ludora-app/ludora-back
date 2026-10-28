import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Parameter decorator to retrieve the authenticated user populated by the auth guards.
 * - Without argument: returns the whole `request.user`
 * - With a key: returns only that field
 * Throws an UnauthorizedException if no guard populated `request.user`.
 *
 * @example
 * joinSession(@CurrentUser('uid') userUid: string)
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authenticated user missing from request');
    }

    return data ? user[data] : user;
  },
);
