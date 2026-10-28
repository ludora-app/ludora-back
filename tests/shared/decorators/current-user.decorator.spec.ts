import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/interfaces/authenticated-user.interface';

type DecoratorFactory = (
  data: keyof AuthenticatedUser | undefined,
  ctx: ExecutionContext,
) => unknown;

// Retrieves the factory function registered by createParamDecorator
const getFactory = (): DecoratorFactory => {
  class TestController {
    handler(@CurrentUser() _user: AuthenticatedUser): void {}
  }
  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler');
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
};

const createContext = (user?: AuthenticatedUser): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('CurrentUser decorator', () => {
  const factory = getFactory();
  const user: AuthenticatedUser = {
    email: 'john@example.com',
    organisationUid: 'org-123',
    uid: 'user-123',
  };

  it('should return the whole user when no key is given', () => {
    expect(factory(undefined, createContext(user))).toEqual(user);
  });

  it('should return the requested field', () => {
    expect(factory('uid', createContext(user))).toBe('user-123');
    expect(factory('organisationUid', createContext(user))).toBe('org-123');
  });

  it('should throw UnauthorizedException when request.user is missing', () => {
    expect(() => factory('uid', createContext())).toThrow(UnauthorizedException);
  });
});
