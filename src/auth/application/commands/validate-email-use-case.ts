import { Inject, UnauthorizedException } from '@nestjs/common';
import { UserAuthRepository } from 'src/auth/domain/repositories/user-auth.repository';
import { EmailVerificationRepository } from 'src/auth/domain/repositories/email-verification.repository';

export class ValidateEmailUseCase {
  constructor(
    @Inject(EmailVerificationRepository)
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly userAuthRepository: UserAuthRepository,
  ) {}

  async execute(userId: string, code: string): Promise<boolean> {
    const validation = await this.emailVerificationRepository.validateCode(userId, code);
    if (!validation) throw new UnauthorizedException('Invalid or expired verification code');
    await this.emailVerificationRepository.updateEmailVerified(userId);
    return validation;
  }
}
