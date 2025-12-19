import { SetMetadata } from '@nestjs/common';

export const RESET_PASSWORD_KEY = 'resetPassword';

/**
 * Decorator to bypass the token type check in the auth-b2c.guard, only used for the password reset workflow
 */
export const ResetPassword = () => SetMetadata(RESET_PASSWORD_KEY, true);
