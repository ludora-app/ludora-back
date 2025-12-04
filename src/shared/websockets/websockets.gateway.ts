import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';

import { WebsocketsRessourceType } from './websockets-ressource-type';

@WebSocketGateway()
export class WebsocketsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  /**
   * Handle the connection event
   * @param client - The socket client
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token as string;

      if (!token) {
        client.emit('message', {
          action: 'AUTHENTICATE',
          payload: { isAuthenticated: false },
          ressource: WebsocketsRessourceType.AUTHENTICATION,
        });
        client.disconnect();
        throw new UnauthorizedException('Aucun token fourni, déconnexion...');
      }

      client.emit('message', {
        action: 'AUTHENTICATE',
        payload: { isAuthenticated: true },
        ressource: WebsocketsRessourceType.AUTHENTICATION,
      });
    } catch {
      client.disconnect();
      throw new UnauthorizedException('Token invalide, déconnexion...');
    }
  }

  /**
   * Handle the join room event
   * @param client - The socket client
   * @param data - The data containing the room to join
   */
  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, data: { room: string }): void {
    client.join(data.room);
    console.log(`📌 Client ${client.id} a rejoint la room ${data.room}`);
  }

  /**
   * Handle the leave room event
   * @param client - The socket client
   * @param data - The data containing the room to leave
   */
  @SubscribeMessage('leave')
  handleLeaveRoom(client: Socket, data: { room: string }): void {
    client.leave(data.room);
    console.log(`📌 Client ${client.id} a quitté la room ${data.room}`);
  }

  /**
   * Handle the send message event
   * @param action - The action to perform
   * @param payload - The payload containing the message
   * @param userId - The user id
   */
  @SubscribeMessage('message')
  handleSendMessage({ action, payload, userId }): void {
    this.server.to(`user_${userId}`).emit('message', {
      action,
      payload,
      ressource: WebsocketsRessourceType.MESSAGE,
    });
  }

  /**
   * Handle the invitation event
   * @param action - The action to perform
   * @param payload - The payload containing the invitation
   * @param userId - The user id
   */
  @SubscribeMessage('invitation')
  handleInvitations({ action, payload, userId }): void {
    this.server.to(`user_${userId}`).emit('invitation', {
      action,
      payload,
      ressource: WebsocketsRessourceType.INVITATION,
    });
  }
}
