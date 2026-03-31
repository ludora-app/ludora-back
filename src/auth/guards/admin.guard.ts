import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';
import { UserType } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdminGuard.name);
  }

  private get ADMIN_1_EMAIL() {
    return this.configService.getOrThrow<string>('ADMIN_1_EMAIL');
  }

  private get ADMIN_2_EMAIL() {
    return this.configService.getOrThrow<string>('ADMIN_2_EMAIL');
  }

  private get ADMIN_EMAILS() {
    return [this.ADMIN_1_EMAIL, this.ADMIN_2_EMAIL];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const user = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.type !== UserType.ADMIN) {
        throw new UnauthorizedException('User is not an admin');
      }

      if (!this.ADMIN_EMAILS.includes(user.email)) {
        throw new UnauthorizedException('User is not an admin');
      }

      const fullPayload = {
        ...payload,
        email: user.email,
        userType: user.type,
      };

      request['user'] = fullPayload;
      return true;
    } catch (error) {
      // error log
      this.logger.error(error.message);

      // if it's already a UnauthorizedException, we throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // else, throws a generic error
      throw new UnauthorizedException('Access denied');
    }
  }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
