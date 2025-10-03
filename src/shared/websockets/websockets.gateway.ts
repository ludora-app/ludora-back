import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';

@WebSocketGateway()
export class WebsocketsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token as string;

      if (!token) {
        client.emit('message', {
          action: 'AUTHENTICATE',
          payload: { isAuthenticated: false },
          ressource: 'CREATED',
        });
        client.disconnect();
        throw new UnauthorizedException('Aucun token fourni, déconnexion...');
      }

      client.emit('message', {
        action: 'AUTHENTICATE',
        payload: { isAuthenticated: true },
        ressource: 'CREATED',
      });
    } catch {
      client.disconnect();
      throw new UnauthorizedException('Token invalide, déconnexion...');
    }
  }

  // ✅ L’utilisateur rejoint sa room perso
  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, data: { room: string }) {
    client.join(data.room);
    console.log(`📌 Client ${client.id} a rejoint la room ${data.room}`);
  }

  // quitter la room
  @SubscribeMessage('leave')
  handleLeaveRoom(client: Socket, data: { room: string }) {
    client.leave(data.room);
    console.log(`📌 Client ${client.id} a quitté la room ${data.room}`);
  }

  // 📩 Envoyer un message à une room
  @SubscribeMessage('message')
  handleSendMessage({ action, payload, ressource, user_id }) {
    this.server.to(`user_${user_id}`).emit('message', {
      action,
      payload,
      ressource,
    });
  }
  @SubscribeMessage('invitation')
  handleInvitations({ action, payload, ressource, user_id }) {
    this.server.to(`user_${user_id}`).emit('invitation', {
      action,
      payload,
      ressource,
    });
  }
}
