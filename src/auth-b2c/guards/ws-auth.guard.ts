import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenType } from 'src/shared/constants/constants';
import { USERSELECT } from 'src/shared/constants/select-user';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * WebSocket Authentication Guard
 * Reuses the same logic as AuthB2CGuard but for WebSocket connections
 * Can extract the token from multiple sources (auth.token, query.auth, query.token, headers.authorization)
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WsAuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();

      // Extract token from multiple sources (support different clients)
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`WebSocket connection rejected: No token provided (client: ${client.id})`);
        client.emit('error', {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        });
        client.disconnect();
        return false;
      }

      // Verify and decode the JWT
      const payload = await this.jwtService.verifyAsync(token);
      const { type, uid: userUid } = payload;

      if (!userUid) {
        throw new UnauthorizedException('Token invalid: user missing');
      }

      // Verify that this is not a reset password token
      if (type === TokenType.RESET) {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify that the token still exists in the database
      const tokenRecord = await this.prisma.userTokens.findFirst({
        where: {
          token,
          userUid,
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

      // Attach user info to socket data for use in handlers
      client.data.user = payload;
      client.data.userUid = userUid;

      this.logger.debug(`WebSocket authenticated: user ${userUid} (socket: ${client.id})`);

      return true;
    } catch (error) {
      const client: Socket = context.switchToWs().getClient();

      this.logger.error(`WebSocket auth error: ${error.message}`, {
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });

      client.emit('error', {
        code: 'AUTH_FAILED',
        message: error instanceof UnauthorizedException ? error.message : 'Authentication failed',
      });
      client.disconnect();

      return false;
    }
  }

  /**
   * Extract token from multiple sources to support different clients
   * Priority: auth.token > query.auth > query.token > headers.authorization
   */
  private extractToken(client: Socket): string | undefined {
    // 1. Via Socket.io auth (client JavaScript)
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token as string;
    }

    // 2. Via query params ?auth=xxx (Postman, etc.)
    if (client.handshake.query?.auth) {
      return client.handshake.query.auth as string;
    }

    // 3. Via query params ?token=xxx
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    // 4. Via Authorization header (Bearer token)
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    return undefined;
  }
}
