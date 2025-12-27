import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { Messages } from 'generated/prisma/browser';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageStatus, MessageType } from 'generated/prisma/enums';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessagesService.name);
  }

  /**
   * Create a message in a conversation
   * @param senderUid - The sender's user uid
   * @param content - The content of the message
   * @param conversationUid - The conversation uid
   * @param type - The type of the message
   * @returns The created message
   */
  async createMessage(
    senderUid: string,
    content: string,
    conversationUid: string,
    type: MessageType,
  ): Promise<Messages> {
    return this.prisma.$transaction(async (tx) => {
      // Verify conversation exists
      const conversation = await tx.conversations.findUnique({
        where: { uid: conversationUid },
      });

      if (!conversation) {
        throw new Error(`Conversation with uid ${conversationUid} not found`);
      }

      // Verify sender is a member of the conversation
      const isMember = await tx.conversationMembers.findFirst({
        where: {
          conversationUid,
          userUid: senderUid,
        },
      });

      if (!isMember) {
        throw new Error(`User ${senderUid} is not a member of conversation ${conversationUid}`);
      }

      // Create the message
      const message = await tx.messages.create({
        data: {
          content,
          conversation: {
            connect: { uid: conversationUid },
          },
          globalStatus: MessageStatus.SENT,
          sender: {
            connect: { uid: senderUid },
          },
          type,
        },
        include: {
          sender: {
            select: {
              firstname: true,
              imageUrl: true,
              lastname: true,
              uid: true,
            },
          },
        },
      });

      // Update conversation's updatedAt to sort by most recent activity
      await tx.conversations.update({
        data: { updatedAt: new Date() },
        where: { uid: conversationUid },
      });

      this.logger.debug(
        `Message ${message.uid} created in conversation ${conversationUid} by user ${senderUid}`,
      );

      return message;
    });
  }

  /**
   * Get messages from a conversation with pagination
   * @param conversationUid - The conversation uid
   * @param userUid - The user uid requesting the messages
   * @param cursor - Optional cursor for pagination
   * @param limit - Number of messages to fetch (default: 50)
   * @returns Array of messages
   */
  async getMessages(
    conversationUid: string,
    userUid: string,
    cursor?: string,
    limit = 50,
  ): Promise<Messages[]> {
    // Verify user is a member of the conversation
    const isMember = await this.prisma.conversationMembers.findFirst({
      where: {
        conversationUid,
        userUid,
      },
    });

    if (!isMember) {
      throw new Error(`User ${userUid} is not a member of conversation ${conversationUid}`);
    }

    const query: any = {
      include: {
        sender: {
          select: {
            firstname: true,
            lastname: true,
            profilePicture: true,
            uid: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      where: {
        conversationUid,
      },
    };

    if (cursor) {
      query.cursor = {
        uid: cursor,
      };
      query.skip = 1;
    }

    return this.prisma.messages.findMany(query);
  }

  /**
   * Mark messages as read for a user in a conversation
   * @param conversationUid - The conversation uid
   * @param userUid - The user uid
   * @returns Number of messages updated
   */
  async markMessagesAsRead(conversationUid: string, userUid: string): Promise<number> {
    // Verify user is a member
    const isMember = await this.prisma.conversationMembers.findFirst({
      where: {
        conversationUid,
        userUid,
      },
    });

    if (!isMember) {
      throw new Error(`User ${userUid} is not a member of conversation ${conversationUid}`);
    }

    const result = await this.prisma.messages.updateMany({
      data: {
        globalStatus: MessageStatus.READ,
      },
      where: {
        conversationUid,
        globalStatus: {
          not: MessageStatus.READ,
        },
        senderUid: {
          not: userUid,
        },
      },
    });

    this.logger.debug(
      `Marked ${result.count} messages as read for user ${userUid} in conversation ${conversationUid}`,
    );

    return result.count;
  }
}
