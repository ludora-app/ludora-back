import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from 'src/users/users.service';

/**
 * @description This guard is used to verify the email of the user by clicking on the link in the email
 * It retrieves the email and code from the JWT token IN THE QUERY PARAMS and verifies the user and the code
 */
@Injectable()
export class VerifyEmailGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromQuery(request); // or extractTokenFromHeader

    if (!token) {
      throw new UnauthorizedException('Token missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const { code, email } = payload;

      if (!email || !code) {
        throw new UnauthorizedException('Token invalid: email or code missing');
      }

      const user = await this.usersService.findOneByEmail(email, USERSELECT.findOneByEmail);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const verification = await this.prisma.emailVerification.findFirst({
        where: {
          code,
          expiresAt: {
            gt: new Date(),
          },
          userUid: user.uid,
        },
      });

      if (!verification) {
        throw new UnauthorizedException('Invalid or expired code');
      }

      request.verificationCode = code;
      request.user = user;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromQuery(request: FastifyRequest): string | undefined {
    return (request.query as any)?.token;
  }
}
