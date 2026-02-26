import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenType } from 'src/shared/constants/constants';
import { USERSELECT } from 'src/shared/constants/select-user';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class WebSocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebSocketAuthService.name);
  }

  async authenticateSocket(client: Socket): Promise<string> {
    const token = this.extractToken(client);

    if (!token) throw new WsException('Authentication required');

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const { type, uid: userUid } = payload;

      if (type === TokenType.RESET) {
        this.logger.error('Reset tokens are not supported for WebSocket authentication');
        throw new WsException('Token invalid: user missing');
      }

      if (!userUid) {
        throw new WsException('Token invalid: user missing');
      }

      // Verify that the token still exists in the database
      const tokenRecord = await this.prisma.userTokens.findFirst({
        where: {
          token,
          userUid: userUid,
        },
      });

      if (!tokenRecord) {
        throw new WsException('Token expired or invalid');
      }

      // Check if the user exists and is active
      const user = await this.usersService.findOne(userUid, USERSELECT.checkIfUserExists);

      if (!user) {
        this.logger.error(`User not found for userUid: ${userUid}`);
        throw new WsException('User not found');
      }

      // Attach user info to client data
      client.data.user = payload;
      client.data.userUid = userUid;

      return userUid;
    } catch (e) {
      if (e instanceof WsException) {
        throw e;
      }
      this.logger.error(`Invalid credentials: ${e.message}`);
      throw new WsException('Invalid credentials');
    }
  }

  /**
   * Extract token from multiple sources to support different clients
   * Priority: auth.token > query.auth > query.token > headers.authorization
   */
  private extractToken(client: Socket): string | undefined {
    this.logger.debug(
      `Extracting token from handshake: ${JSON.stringify({
        authHeader: client.handshake.headers?.authorization,
        authKeys: client.handshake.auth ? Object.keys(client.handshake.auth) : [],
        hasAuth: !!client.handshake.auth,
        hasHeaders: !!client.handshake.headers,
        hasQuery: !!client.handshake.query,
        queryKeys: client.handshake.query ? Object.keys(client.handshake.query) : [],
      })}`,
    );

    // 1. Via Socket.io auth (client JavaScript)
    if (client.handshake.auth?.token) {
      this.logger.debug('Token found in handshake.auth.token');
      return client.handshake.auth.token as string;
    }

    // 2. Via query params ?auth=xxx (Postman, etc.)
    // Note: Socket.io query params are always arrays, need to handle that
    const queryAuth = client.handshake.query?.auth;
    if (queryAuth) {
      const token = Array.isArray(queryAuth) ? queryAuth[0] : queryAuth;
      this.logger.debug('Token found in handshake.query.auth');
      return token as string;
    }

    // 3. Via query params ?token=xxx
    const queryToken = client.handshake.query?.token;
    if (queryToken) {
      const token = Array.isArray(queryToken) ? queryToken[0] : queryToken;
      this.logger.debug('Token found in handshake.query.token');
      return token as string;
    }

    // 4. Via Authorization header (Bearer token)
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        this.logger.debug('Token found in Authorization header');
        return token;
      }
    }

    this.logger.debug('No token found in any source');
    return undefined;
  }
}
