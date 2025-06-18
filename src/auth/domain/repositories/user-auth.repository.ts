import { UserAuthInfo } from '../entities/user-auth-info';
import { LoginCredentials } from '../entities/login-credentials';

export abstract class UserAuthRepository {
  abstract findUserById(id: string): Promise<UserAuthInfo | null>;
  abstract registerUser(credentials: LoginCredentials): Promise<UserAuthInfo>;
  abstract validateUser(credentials: LoginCredentials): Promise<UserAuthInfo | null>;
  abstract sendVerificationEmail(userId: string, email: string): Promise<void>;
  abstract validateEmail(userId: string, code: string): Promise<boolean>;
}
