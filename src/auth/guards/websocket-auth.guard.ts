import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

import { WebSocketAuthService } from '../services/websocket-auth.service';

/**
 * WebSocket Authentication Guard
 * Reuses the same logic as AuthB2CGuard but for WebSocket connections
 * Can extract the token from multiple sources (auth.token, query.auth, query.token, headers.authorization)
 */
@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  constructor(private readonly webSocketAuthService: WebSocketAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    // If the user is already authenticated, skip authentication
    if (client.data.userUid) {
      return true;
    }

    try {
      await this.webSocketAuthService.authenticateSocket(client);
      return true;
    } catch (err) {
      console.error('WebSocket Auth Guard Error:', {
        message: err.message,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  }
}
