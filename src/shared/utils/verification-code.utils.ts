import * as crypto from 'crypto';

export class VerificationCodeUtil {
  /**
   * The function generates a random verification code between 100,000 and 999,999 as a string.
   * @returns A randomly generated verification code between 100,000 and 999,999 as a string.
   */
  static generateVerificationCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }
}
