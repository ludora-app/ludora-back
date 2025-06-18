import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailVerificationRepository } from 'src/auth/domain/repositories/email-verification.repository';

@Injectable()
export class PrismaAuthAdapter implements EmailVerificationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string): Promise<string> {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prismaService.$transaction(async (prisma) => {
      await prisma.email_verification.deleteMany({
        where: { userId: userId },
      });

      await prisma.email_verification.create({
        data: {
          code: verificationCode,
          expiresAt,
          userId: userId,
        },
      });
    });
    return verificationCode;
  }

  async validateCode(userId: string, code: string): Promise<boolean> {
    const verification = await this.prismaService.email_verification.findFirst({
      where: { userId: userId },
    });
    if (!verification) return false;
    if (verification.expiresAt < new Date()) return false;
    if (verification.code !== code) return false;

    return true;
  }

  async updateEmailVerified(userId: string): Promise<void> {
    await this.prismaService.users.update({
      data: { emailVerified: true },
      where: { id: userId },
    });
  }
}
