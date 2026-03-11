import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageStatus, MessageType } from 'generated/prisma/enums';
import { PinoLogger } from 'nestjs-pino';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageFolderName } from 'src/shared/constants/constants';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { StorageService } from 'src/shared/storage/storage.service';
import { MessageCollectionItemDto } from '../dto/output/message-collection-response.dto';
import { MessageMapper } from '../mappers/message.mapper';

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

    const now = new Date();

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

    await this.prisma.conversations.update({
      data: { updatedAt: now },
      where: { uid: conversationUid },
    });

    const membersUids = await this.getOtherMembersUids(conversationUid, senderUid);
    await this.createMessageReceipt(message.uid, membersUids, senderUid);

    const senderName = `${message.sender.firstname ?? ''} ${message.sender.lastname ?? ''}`.trim();

    //? default notification title for a private conversation
    let notificationTitle = `${senderName} t'a envoyé un message`;

    //? if the conversation is a Session Conversation, add the sessionUid to the notification title
    if (sessionUid)
      notificationTitle = `Session ${sessionUid} - ${senderName} t'a envoyé un message`;

    this.eventEmitter.emit(EventTypes.NEW_MESSAGE, {
      content,
      conversationUid,
      notificationTitle,
      senderAvatar: message.sender.imageUrl ?? undefined,
      senderName,
      senderUid,
      sessionUid: sessionUid ?? undefined,
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
    const now = new Date();
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

    await this.prisma.conversations.update({
      data: { updatedAt: now },
      where: { uid: conversationUid },
    });

    const membersUids = await this.getOtherMembersUids(conversationUid, senderUid);
    await this.createMessageReceipt(message.uid, membersUids, senderUid);

    const senderName = `${message.sender.firstname ?? ''} ${message.sender.lastname ?? ''}`.trim();

    //? default notification title for a private conversation
    let notificationTitle = `${senderName} t'a envoyé un message`;

    //? if the conversation is a Session Conversation, add the sessionUid to the notification title
    if (sessionUid)
      notificationTitle = `Session ${sessionUid} - ${senderName} t'a envoyé un message`;

    this.eventEmitter.emit(EventTypes.NEW_MESSAGE, {
      content: uploadedFile.data,
      conversationUid,
      notificationTitle,
      senderAvatar: message.sender.imageUrl ?? undefined,
      senderName,
      senderUid,
      sessionUid: sessionUid ?? undefined,
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

    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

    // paginatedMessages[paginatedMessages.length - 1] est le plus ancien de la page
    // c'est lui qu'on donne comme curseur pour la prochaine page (encore plus dans le passé)
    const nextCursor = hasMore ? paginatedMessages[paginatedMessages.length - 1].uid : null;

    this.eventEmitter.emit(EventTypes.MARK_MESSAGES_AS_READ, {
      conversationUid,
      userUid,
    });

    return {
      // on reverse pour afficher du plus ancien au plus récent (ordre naturel du chat)
      items: [...paginatedMessages]
        .reverse()
        .map((message) => MessageMapper.toCollectionItemDto(message, userUid)),
      nextCursor,
      totalCount: paginatedMessages.length,
    };
  }

  /**
   * Mark messages as read for a user in a conversation
   * @param conversationUid - The conversation uid
   * @param userUid - The user uid
   * @returns Number of messages updated
   */
  async markMessagesAsRead(
    conversationUid: string,
    userUid: string,
  ): Promise<{
    count: number;
    messages: { uid: string; hasAnyRead: boolean; hasEveryoneRead: boolean }[];
  }> {
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

    // Filter by the user's own receipt status
    const targetReceipts = await this.prisma.messageReceipts.findMany({
      select: { messageUid: true },
      where: {
        message: {
          conversationUid,
          senderUid: { not: userUid },
        },
        status: { not: MessageStatus.READ },
        userUid,
      },
    });

    const messageUids = targetReceipts.map((receipt) => receipt.messageUid);

    await this.prisma.messages.updateMany({
      data: { globalStatus: MessageStatus.READ },
      where: { uid: { in: messageUids } },
    });

    const result = await this.prisma.messageReceipts.updateMany({
      data: { status: MessageStatus.READ },
      where: {
        messageUid: { in: messageUids },
        userUid,
      },
    });

    const updatedMessages = await this.prisma.messages.findMany({
      include: {
        messageReceipts: true,
      },
      where: { uid: { in: messageUids } },
    });

    const messagesData = updatedMessages.map((msg) => {
      const recipientReceipts = msg.messageReceipts.filter((r) => r.userUid !== msg.senderUid);
      const readReceipts = recipientReceipts.filter((r) => r.status === MessageStatus.READ);

      return {
        hasAnyRead: readReceipts.length > 0,
        hasEveryoneRead:
          recipientReceipts.length > 0 && readReceipts.length === recipientReceipts.length,
        uid: msg.uid,
      };
    });

    this.logger.debug(
      `Marked ${result.count} messages as read for user ${userUid} in conversation ${conversationUid}`,
    );

    return {
      count: result.count,
      messages: messagesData,
    };
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

  async delete(messageUid: string, userUid: string): Promise<void> {
    const message = await this.prisma.messages.findUnique({
      include: {
        conversation: {
          select: { sessionUid: true },
        },
        sender: {
          select: { firstname: true, lastname: true },
        },
      },
      where: { uid: messageUid },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderUid !== userUid) {
      throw new ForbiddenException('You are not the sender of this message');
    }

    if (message.globalStatus === MessageStatus.DELETED) {
      throw new BadRequestException('Message already deleted');
    }

    await this.prisma.messages.update({
      data: {
        globalStatus: MessageStatus.DELETED,
      },
      where: { uid: messageUid },
    });

    const senderName =
      `${message.sender?.firstname ?? ''} ${message.sender?.lastname ?? ''}`.trim();

    this.eventEmitter.emit(EventTypes.MESSAGE_DELETED, {
      conversationUid: message.conversationUid,
      messageUid,
      senderName,
      sessionUid: message.conversation.sessionUid,
      userUid,
    });
  }
}
