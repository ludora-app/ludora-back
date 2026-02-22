import { PinoLogger } from 'nestjs-pino';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from 'generated/prisma/enums';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventTypes } from 'src/notifications/constants/event.types';
import { WebSocketAuthGuard } from 'src/auth/guards/websocket-auth.guard';
import { CreateMessageDto } from 'src/conversations/dto/input/create-message.dto';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { TypingIndicatorDto } from './dto/input/typing-indicator.dto';
import { MessagesService } from '../conversations/services/messages.service';
import { ConversationsService } from '../conversations/services/conversations.service';

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
    private readonly conversationsService: ConversationsService,
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
   * - Creates message in database (or finds/creates conversation if recipientUid is provided)
   * - Broadcasts to all users in the conversation room
   */
  @UsePipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        return errors;
      },
      transform: true,
    }),
  )
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageDto,
  ): Promise<{
    data: { conversationUid: string; messageUid: string } | null;
    error: any;
  }> {
    try {
      const userUid = client.data.userUid;

      if (!userUid) {
        return {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
        };
      }

      // DEV ONLY: simulate an error for frontend testing only on dev environment
      if (data.content === 'Error' && process.env.NODE_ENV !== 'production') {
        throw new Error('Simulated error for testing');
      }

      // Create message - the service handles finding/creating conversations
      const { conversationUid, messageUid } = await this.conversationsService.createMessage(
        userUid,
        data,
      );

      // If a new private conversation was created, join both users to the room
      if (data.recipientUid && !data.conversationUid) {
        const conversationRoom = `conversation:${conversationUid}`;
        const sockets = await this.server.fetchSockets();
        for (const socket of sockets) {
          if (socket.data.userUid === userUid || socket.data.userUid === data.recipientUid) {
            await socket.join(conversationRoom);
          }
        }
      }

      // Broadcast to all users in the conversation room EXCEPT the sender
      // (the sender already receives their own 'notification' event above)
      const conversationRoom = `conversation:${conversationUid}`;
      client.to(conversationRoom).emit('newMessage', {
        conversationUid,
      });

      // Send acknowledgment to the sender
      client.emit('notification', {
        conversationUid,
        messageUid,
        type: NotificationType.MESSAGE_SENT,
      });

      this.logger.debug(`Message sent to conversation ${conversationUid} by user ${userUid}`);
      this.logger.debug(`Emitted messageSent event to sender with messageUid: ${messageUid}`);

      return {
        data: {
          conversationUid,
          messageUid,
        },
        error: null,
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return {
        data: null,
        error: {
          code: 'MESSAGE_SEND_FAILED',
          message: error.message || 'Failed to send message',
        },
      };
    }
  }

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
   * Handle EventEmitter2 event for marking messages as read (triggered from HTTP endpoints)
   */
  @OnEvent(EventTypes.MARK_MESSAGES_AS_READ)
  async handleMarkAsReadEvent(payload: {
    conversationUid: string;
    userUid: string;
  }): Promise<void> {
    try {
      const { conversationUid, userUid } = payload;

      const { count, messages } = await this.messagesService.markMessagesAsRead(
        conversationUid,
        userUid,
      );

      const conversationRoom = `conversation:${conversationUid}`;

      if (count > 0) {
        // Notify others in the conversation that messages have been read
        this.server
          .to(conversationRoom)
          .except(`user:${userUid}`)
          .emit('notification', {
            data: { conversationUid, messages, userUid },
            message: `${userUid} marked ${count} messages from ${conversationUid} as read`,
            type: NotificationType.MESSAGES_READ,
          });

        // Notify the user who read the messages to update their conversation list (e.g. unread count)
        this.server.to(`user:${userUid}`).emit('notification', {
          data: { conversationUid, messages, userUid },
          message: `${userUid} marked ${count} messages from ${conversationUid} as read`,
          type: NotificationType.CONVERSATION_READ,
        });
      }

      this.logger.debug(
        `[Event] User ${userUid} marked ${count} messages as read in ${conversationUid}`,
      );
    } catch (error) {
      this.logger.error(`Error handling mark as read event: ${error.message}`);
    }
  }
  @OnEvent(EventTypes.MESSAGE_DELETED)
  async handleMessageDeletedEvent(payload: {
    conversationUid: string;
    messageUid: string;
    userUid: string;
  }): Promise<void> {
    try {
      const { conversationUid, messageUid, userUid } = payload;
      const conversationRoom = `conversation:${conversationUid}`;

      this.server.to(conversationRoom).emit('notification', {
        data: { conversationUid, messageUid, userUid },
        message: `Message ${messageUid} was deleted by ${userUid}`,
        type: NotificationType.MESSAGE_DELETED,
      });

      this.logger.debug(
        `[Event] Message ${messageUid} deleted by ${userUid} in ${conversationUid}`,
      );
    } catch (error) {
      this.logger.error(`Error handling message deleted event: ${error.message}`);
    }
  }
}
