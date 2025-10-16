import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PartnersService } from 'src/partners/partners.service';
import { IS_PUBLIC_KEY } from 'src/shared/decorators/public.decorator';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthB2BGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly partnerService: PartnersService,
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
      const { organisationUid, uid: userUid } = payload;

      if (!userUid || !organisationUid) {
        throw new UnauthorizedException('Token invalid: user or organisation missing');
      }

      // Verify that the token still exists in the database
      const tokenRecord = await this.prisma.userTokens.findFirst({
        where: {
          organisationUid: organisationUid,
          token,
          userUid: userUid,
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Token expired or invalid');
      }

      // Check if the user is verified and active
      const user = await this.prisma.users.findUnique({
        select: { emailVerified: true, isConnected: true, uid: true },
        where: { uid: userUid },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isConnected) {
        throw new UnauthorizedException('User account disabled');
      }
      const partner = await this.prisma.partners.findUnique({
        where: { uid: organisationUid },
      });
      if (!partner) {
        throw new UnauthorizedException('Partner not found');
      }

      request['user'] = payload;
      return true;
    } catch (error) {
      // error log
      console.error('🔒 Auth Guard Error:', {
        message: error.message,
        timestamp: new Date().toISOString(),
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
