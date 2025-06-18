export abstract class EmailVerificationRepository {
  abstract create(userId: string): Promise<string>;
  abstract validateCode(userId: string, code: string): Promise<boolean>;
  abstract updateEmailVerified(userId: string): Promise<void>;
  //   abstract deleteAll(userId: string): Promise<void>;
  //   abstract findByUserId(userId: string): Promise<EmailVerification | null>;
}
