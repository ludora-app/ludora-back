import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { User_tokens } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenRepository } from 'src/auth/domain/repositories/token.repository';
import { UserNotFoundDomainError } from 'src/users/domain/errors/user-not-found.error';

@Injectable()
export class TokenAdapter implements TokenRepository {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  sign(payload: any): string {
    return this.jwt.sign(payload);
  }
  async deleteTokenById(id: string): Promise<void> {
    await this.prisma.user_tokens.delete({
      where: {
        id,
      },
    });
  }

  async getTokensForUser(userId: string): Promise<User_tokens[]> {
    const user = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UserNotFoundDomainError(userId);
    }

    const tokens = await this.prisma.user_tokens.findMany({
      where: {
        userId,
      },
    });

    return tokens;
  }

  async saveToken(userId: string, token: string, deviceId?: string): Promise<void> {
    await this.prisma.user_tokens.create({
      data: {
        deviceId,
        token,
        userId,
      },
    });
  }
}
