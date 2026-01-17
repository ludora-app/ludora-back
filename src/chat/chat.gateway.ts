import { PinoLogger } from 'nestjs-pino';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { WebSocketAuthGuard } from 'src/auth/guards/websocket-auth.guard';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { MessagesService } from '../conversations/messages.service';
import { TypingIndicatorDto } from './dto/input/typing-indicator.dto';

/**
 * ChatGateway handles real-time chat messaging using Socket.io
 * - Uses JWT authentication for secure connections (via WsAuthGuard)
 * - Implements stateless design with Socket.io rooms (no Maps)
 * - Compatible with Redis Adapter for horizontal scaling
 */
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: '*', // Configure this properly in production
  },
})
@UseGuards(WebSocketAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatGateway.name);
  }

  /**
   * Handle new WebSocket connection
   * - Authentication is handled by WsAuthGuard (called before this method)
   * - This method is called ONLY after successful authentication
   * - Joins user to their personal room (user:{userId})
   * - Joins user to all their conversation rooms (conversation:{conversationId})
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      // client.data.userUid is set by the guard
      const userUid = client.data.userUid;

      this.logger.debug(`Chat connection for authenticated user ${userUid}`);

      // Join personal room for direct messaging
      const userRoom = `user:${userUid}`;
      await client.join(userRoom);

      // Join all conversation rooms the user is a member of
      const conversations = await this.prisma.conversationMembers.findMany({
        select: {
          conversationUid: true,
        },
        where: {
          userUid,
        },
      });

      for (const conv of conversations) {
        const conversationRoom = `conversation:${conv.conversationUid}`;
        await client.join(conversationRoom);
      }

      this.logger.info(
        `User ${userUid} connected to chat (socket: ${client.id}). Joined ${conversations.length} conversations.`,
      );

      // Notify user of successful connection
      client.emit('connected', {
        conversations: conversations.map((c) => c.conversationUid),
        message: 'Successfully connected to chat',
        userUid,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', {
        code: 'CONNECTION_FAILED',
        message: 'Connection failed',
      });
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   * - Socket.io automatically removes the socket from all rooms
   * - No manual cleanup needed (stateless design)
   */
  handleDisconnect(client: Socket): void {
    const userUid = client.data.userUid;
    if (userUid) {
      this.logger.info(`User ${userUid} disconnected from chat (socket: ${client.id})`);
    } else {
      this.logger.info(`Unauthenticated socket ${client.id} disconnected`);
    }
  }

  /**
   * Handle incoming chat messages
   * - Validates message data
   * - Creates message in database
   * - Broadcasts to all users in the conversation room
   */
  // @SubscribeMessage('sendMessage')
  // async handleSendMessage(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() data: SendMessageDto,
  // ): Promise<void> {
  //   try {
  //     const userUid = client.data.userUid;

  //     if (!userUid) {
  //       client.emit('error', {
  //         code: 'UNAUTHORIZED',
  //         message: 'Unauthorized',
  //       });
  //       return;
  //     }

  //     const { content, conversationUid, type } = data;

  //     // Create message in database
  //     const message = await this.messagesService.createTextMessage(
  //       userUid,
  //       content,
  //       conversationUid,
  //       type || MessageType.TEXT,
  //     );

  //     // Broadcast to all users in the conversation room
  //     const conversationRoom = `conversation:${conversationUid}`;
  //     this.server.to(conversationRoom).emit('newMessage', {
  //       conversationUid,
  //       message,
  //     });

  //     this.logger.debug(
  //       `Message ${message.uid} sent to conversation ${conversationUid} by user ${userUid}`,
  //     );
  //   } catch (error) {
  //     this.logger.error(`Error sending message: ${error.message}`);
  //     client.emit('error', {
  //       code: 'MESSAGE_SEND_FAILED',
  //       message: error.message || 'Failed to send message',
  //     });
  //   }
  // }

  /**
   * Handle joining a new conversation room
   * - Verifies user is a member of the conversation
   * - Joins the conversation room
   */
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationUid: string },
  ): Promise<void> {
    try {
      const userUid = client.data.userUid;

      if (!userUid) {
        client.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });
        return;
      }

      const { conversationUid } = data;

      // Verify user is a member of the conversation
      const isMember = await this.prisma.conversationMembers.findFirst({
        where: {
          conversationUid,
          userUid,
        },
      });

      if (!isMember) {
        client.emit('error', {
          code: 'NOT_MEMBER',
          message: 'You are not a member of this conversation',
        });
        return;
      }

      const conversationRoom = `conversation:${conversationUid}`;
      await client.join(conversationRoom);

      client.emit('joinedConversation', {
        conversationUid,
        message: 'Successfully joined conversation',
      });

      this.logger.debug(`User ${userUid} joined conversation ${conversationUid}`);
    } catch (error) {
      this.logger.error(`Error joining conversation: ${error.message}`);
      client.emit('error', {
        code: 'JOIN_FAILED',
        message: 'Failed to join conversation',
      });
    }
  }

  /**
   * Handle leaving a conversation room
   * - Removes user from the conversation room
   */
  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationUid: string },
  ): Promise<void> {
    try {
      const userUid = client.data.userUid;
      const { conversationUid } = data;

      const conversationRoom = `conversation:${conversationUid}`;
      await client.leave(conversationRoom);

      client.emit('leftConversation', {
        conversationUid,
        message: 'Successfully left conversation',
      });

      this.logger.debug(`User ${userUid} left conversation ${conversationUid}`);
    } catch (error) {
      this.logger.error(`Error leaving conversation: ${error.message}`);
    }
  }

  /**
   * Handle typing indicator
   * - Broadcasts typing status to other users in the conversation
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingIndicatorDto,
  ): Promise<void> {
    try {
      const userUid = client.data.userUid;

      if (!userUid) {
        return;
      }

      const { conversationUid, isTyping } = data;

      // Broadcast to all users in the conversation except the sender
      const conversationRoom = `conversation:${conversationUid}`;
      client.to(conversationRoom).emit('userTyping', {
        conversationUid,
        isTyping,
        userUid,
      });
    } catch (error) {
      this.logger.error(`Error handling typing indicator: ${error.message}`);
    }
  }

  /**
   * Handle marking messages as read
   * - Updates message status in database
   * - Notifies other users in the conversation
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationUid: string },
  ): Promise<void> {
    try {
      const userUid = client.data.userUid;

      if (!userUid) {
        return;
      }

      const { conversationUid } = data;

      const count = await this.messagesService.markMessagesAsRead(conversationUid, userUid);

      // Notify the user
      client.emit('markedAsRead', {
        conversationUid,
        count,
      });

      // Notify other users in the conversation
      const conversationRoom = `conversation:${conversationUid}`;
      client.to(conversationRoom).emit('messagesRead', {
        conversationUid,
        userUid,
      });

      this.logger.debug(`User ${userUid} marked ${count} messages as read in ${conversationUid}`);
    } catch (error) {
      this.logger.error(`Error marking messages as read: ${error.message}`);
      client.emit('error', {
        code: 'MARK_READ_FAILED',
        message: 'Failed to mark messages as read',
      });
    }
  }
}
