import { UserType } from 'generated/prisma/enums';
import { TokenType } from 'src/shared/constants/constants';

/**
 * Shape of `request.user` once an auth guard has run.
 * - B2C / admin guards: JWT payload + `email`, `userType` (+ `isEmailVerified` for B2C)
 * - B2B guard: raw JWT payload, which carries `organisationUid`
 */
export interface AuthenticatedUser {
  uid: string;
  type?: TokenType;
  organisationUid?: string;
  email?: string;
  userType?: UserType;
  isEmailVerified?: boolean;
  iat?: number;
  exp?: number;
}
