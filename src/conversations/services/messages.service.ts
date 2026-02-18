import { PinoLogger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageFolderName } from 'src/shared/constants/constants';
import { MessageStatus, MessageType } from 'generated/prisma/enums';
import { StorageService } from 'src/shared/storage/storage.service';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { MessageMapper } from '../mappers/message.mapper';
import { MessageCollectionItemDto } from '../dto/output/message-collection-response.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: StorageService,
  ) {
    this.logger.setContext(MessagesService.name);
  }

  /**
   * Create a text message in a conversation
   * @param senderUid - The sender's user uid
   * @param content - The content of the message
   * @param conversationUid - The conversation uid
   * @param type - The type of the message
   * @returns void
   */
  async createTextMessage(
    senderUid: string,
    content: string,
    conversationUid: string,
    sessionUid: string | null,
  ): Promise<{ messageUid: string }> {
    // Mark messages as read for the sender
    await this.markMessagesAsRead(conversationUid, senderUid);

    // Create the message
    const message = await this.prisma.messages.create({
      data: {
        content,
        conversation: {
          connect: { uid: conversationUid },
        },
        globalStatus: MessageStatus.SENT,
        sender: {
          connect: { uid: senderUid },
        },
        type: MessageType.TEXT,
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

    this.logger.debug(
      `Message ${message.uid} created in conversation ${conversationUid} by user ${senderUid}`,
    );

    const membersUids = await this.getOtherMembersUids(conversationUid, senderUid);
    await this.createMessageReceipt(message.uid, membersUids, senderUid);

    const senderName = `${message.sender.firstname ?? ''} ${message.sender.lastname ?? ''}`.trim();

    //? default notification title for a private conversation
    let notificationTitle = `${senderName} sent you a message`;

    //? if the conversation is a Session Conversation, add the sessionUid to the notification title
    if (sessionUid) notificationTitle = `Session ${sessionUid} - ${senderName} sent you a message`;

    this.eventEmitter.emit(EventTypes.NEW_MESSAGE, {
      content,
      conversationUid,
      notificationTitle,
      senderUid,
    });

    return { messageUid: message.uid };
  }

  /**
   * Create a media message in a conversation
   * @param senderUid - The sender's user uid
   * @param conversationUid - The conversation uid
   * @param type - The type of the message
   * @param file - The file to upload
   * @param sessionUid - The session uid
   * @returns void
   */
  async createMediaMessage(
    senderUid: string,
    conversationUid: string,
    type: MessageType,
    file: any,
    sessionUid: string | null,
  ): Promise<{ messageUid: string }> {
    // Mark messages as read for the sender
    await this.markMessagesAsRead(conversationUid, senderUid);
    const folderName = `${StorageFolderName.CONVERSATIONS}/${conversationUid}`;

    if (!file || !file.buffer || !file.originalname) {
      throw new BadRequestException('File is required for media messages');
    }

    const uploadedFile = await this.storageService.upload(
      folderName,
      file.originalname,
      file.buffer,
    );
    const message = await this.prisma.messages.create({
      data: {
        content: uploadedFile.data,
        conversation: {
          connect: { uid: conversationUid },
        },
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
    this.logger.debug(
      `Message ${message.uid} created in conversation ${conversationUid} by user ${senderUid}`,
    );

    const membersUids = await this.getOtherMembersUids(conversationUid, senderUid);
    await this.createMessageReceipt(message.uid, membersUids, senderUid);

    const senderName = `${message.sender.firstname ?? ''} ${message.sender.lastname ?? ''}`.trim();

    //? default notification title for a private conversation
    let notificationTitle = `${senderName} sent you a message`;

    //? if the conversation is a Session Conversation, add the sessionUid to the notification title
    if (sessionUid) notificationTitle = `Session ${sessionUid} - ${senderName} sent you a message`;

    this.eventEmitter.emit(EventTypes.NEW_MESSAGE, {
      content: uploadedFile.data,
      conversationUid,
      notificationTitle,
      senderUid,
    });

    return { messageUid: message.uid };
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
  ): Promise<PaginatedDataDto<MessageCollectionItemDto>> {
    this.eventEmitter.emit(EventTypes.MARK_MESSAGES_AS_READ, {
      conversationUid,
      userUid,
    });
    const messages = await this.prisma.messages.findMany({
      include: {
        messageReceipts: {
          select: {
            status: true,
            userUid: true,
          },
        },
        sender: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
            uid: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
      where: {
        conversationUid,
      },
      ...(cursor && {
        cursor: {
          uid: cursor,
        },
        skip: 1,
      }),
    });

    return {
      items: messages
        .reverse()
        .map((message) => MessageMapper.toCollectionItemDto(message, userUid)),
      nextCursor: messages.length > limit ? messages[limit].uid : null,
      totalCount: messages.length,
    };
  }

  /**
   * Mark messages as read for a user in a conversation
   * @param conversationUid - The conversation uid
   * @param userUid - The user uid
   * @returns Number of messages updated
   */
  async markMessagesAsRead(conversationUid: string, userUid: string): Promise<number> {
    await this.prisma.conversationMembers.update({
      data: {
        lastReadAt: new Date(),
      },
      where: {
        conversationUid_userUid: {
          conversationUid,
          userUid,
        },
      },
    });

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

  async getOtherMembersUids(conversationUid: string, senderUid: string): Promise<Set<string>> {
    const members = await this.prisma.conversationMembers.findMany({
      select: {
        userUid: true,
      },
      where: { conversationUid, userUid: { not: senderUid } },
    });
    return new Set(members.map((member) => member.userUid));
  }

  async createMessageReceipt(
    messageUid: string,
    userUids: Set<string>,
    senderUid: string,
  ): Promise<void> {
    await this.prisma.messageReceipts.createMany({
      data: Array.from(userUids).map((userUid) => ({
        messageUid,
        userUid,
      })),
    });
    await this.prisma.messageReceipts.create({
      data: {
        messageUid,
        status: MessageStatus.SENT,
        userUid: senderUid,
      },
    });
  }
}
