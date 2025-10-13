import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { PrismaService } from 'src/prisma/prisma.service';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token missing');
    }

    try {
      // Verify and decode the JWT
      const payload = await this.jwtService.verifyAsync(token);
      const { uid: userUid } = payload;

      if (!userUid) {
        throw new UnauthorizedException('Token invalid: user missing');
      }

      // Verify that the token still exists in the database
      const tokenRecord = await this.prisma.userTokens.findFirst({
        where: {
          token,
          userUid: userUid,
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Token expired or invalid');
      }

      // Check if the user is verified and active
      const user = await this.prisma.users.findUnique({
        select: { emailVerified: true, uid: true, isConnected: true },
        where: { uid: userUid },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isConnected) {
        throw new UnauthorizedException('User account disabled');
      }

      request['user'] = payload;
      return true;
    } catch (error) {
      // error log
      console.error('🔒 Auth Guard Error:', {
        message: error.message,
        timestamp: new Date().toISOString(),
        token: token?.substring(0, 20) + '...',
      });

      // if it's already a UnauthorizedException, we throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // else, throws a generic error
      throw new UnauthorizedException('Access denied');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
