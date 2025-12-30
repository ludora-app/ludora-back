import { PinoLogger } from 'nestjs-pino';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { Conversations, ConversationType, MessageType } from 'generated/prisma/browser';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MessagesService } from './messages.service';
import { ConversationFilterDto } from './dto/input/conversation-filter.dto';
import { CreateSessionConversationDto } from './dto/input/create-session-conversation.dto';
import { CreatePrivateConversationDto } from './dto/input/create-private-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly messagesService: MessagesService,
  ) {
    this.logger.setContext(ConversationsService.name);
  }

  /**
   * @description Method called when creating a session, the conversation is created automatically.
   * @param createConversationDto - The DTO containing conversation data
   * @param tx - Optional Prisma transaction client for atomic operations
   * @returns void
   */
  async createSessionConversation(
    createConversationDto: CreateSessionConversationDto,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    // no need to check if the session exists, it will be checked in the sessions service
    if (!createConversationDto.sessionUid) {
      throw new BadRequestException('Session uid is required');
    }

    const prismaClient = tx ?? this.prisma;

    const newConversation = await prismaClient.conversations.create({
      data: {
        name: createConversationDto.name,
        sessionUid: createConversationDto.sessionUid,
        type: createConversationDto.type,
      },
    });

    this.logger.debug(`Conversation ${newConversation.uid} created`);

    await prismaClient.conversationMembers.createMany({
      data: createConversationDto.userUids.map((userUid) => ({
        conversationUid: newConversation.uid,
        userUid: userUid,
      })),
    });

    this.logger.debug(`Conversation members created`);

    this.logger.info(
      `Conversation created successfully for the session ${createConversationDto.sessionUid}`,
    );
  }

  /**
   * @description Method called when a friend invitation is accepted, the conversation is created automatically.
   * @param createPrivateConversationDto - The DTO containing conversation data
   * @param tx - Optional Prisma transaction client for atomic operations
   * @returns void
   */
  async createPrivateConversation(
    createPrivateConversationDto: CreatePrivateConversationDto,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx ?? this.prisma;

    const newConversation = await prismaClient.conversations.create({
      data: {
        type: createPrivateConversationDto.type,
      },
    });
    this.logger.debug(`Conversation ${newConversation.uid} created`);

    await prismaClient.conversationMembers.createMany({
      data: createPrivateConversationDto.userUids.map((userUid) => ({
        conversationUid: newConversation.uid,
        userUid: userUid,
      })),
    });
    this.logger.debug(`Conversation members created`);
  }

  async findAllByUserUid(
    filters: ConversationFilterDto,
    userUid: string,
  ): Promise<PaginatedDataDto<Conversations>> {
    const { cursor, limit, name, type } = filters;

    const query: {
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc';
          };
          take: 1;
        };
      };
      take: number;
      skip?: number;
      cursor?: {
        uid: string;
      };
      where: {
        conversationMembers: {
          some: {
            userUid: string;
          };
        };
        type?: ConversationType;
        name?: {
          contains: string;
          mode: 'insensitive';
        };
      };
    } = {
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      take: limit ? limit + 1 : 10,
      where: {
        conversationMembers: {
          some: {
            userUid: userUid,
          },
        },
      },
    };

    if (cursor) {
      query.cursor = {
        uid: cursor,
      };
      query.skip = 1;
    }

    if (type) {
      query.where.type = type;
    }

    if (name) {
      query.where.name = { contains: name, mode: 'insensitive' };
    }

    const conversations = await this.prisma.conversations.findMany(query);

    const actualLimit = limit || 10;
    let nextCursor: string | null = null;
    if (conversations.length > actualLimit) {
      const nextItem = conversations.pop();
      nextCursor = nextItem!.uid;
    }
    return {
      items: conversations,
      nextCursor,
      totalCount: conversations.length,
    };
  }

  async findOne(conversationUid: string, userUid: string): Promise<Conversations> {
    const existingConversation = await this.prisma.conversations.findUnique({
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
      where: {
        uid: conversationUid,
      },
    });
    if (!existingConversation) {
      throw new NotFoundException(`Conversation with uid ${conversationUid} not found`);
    }

    const isMember = await this.prisma.conversationMembers.findFirst({
      where: {
        conversationUid: conversationUid,
        userUid: userUid,
      },
    });

    if (!isMember) {
      throw new ForbiddenException(`User with uid ${userUid} is not a member of this conversation`);
    }

    return existingConversation;
  }

  async createMockConversation(userUid: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const privateConversations = await Promise.all([
        tx.conversations.create({ data: { type: ConversationType.PRIVATE } }),
        tx.conversations.create({ data: { type: ConversationType.PRIVATE } }),
        tx.conversations.create({ data: { type: ConversationType.PRIVATE } }),
        tx.conversations.create({ data: { type: ConversationType.PRIVATE } }),
        tx.conversations.create({ data: { type: ConversationType.PRIVATE } }),
      ]);

      await tx.conversationMembers.createMany({
        data: privateConversations.map((conv) => ({
          conversationUid: conv.uid,
          userUid: userUid,
        })),
      });

      this.logger.debug(`Private conversations created`);

      const groupConversations = await Promise.all([
        tx.conversations.create({ data: { name: 'Group 1', type: ConversationType.GROUP } }),
        tx.conversations.create({ data: { name: 'Group 2', type: ConversationType.GROUP } }),
        tx.conversations.create({ data: { name: 'Group 3', type: ConversationType.GROUP } }),
        tx.conversations.create({ data: { name: 'Group 4', type: ConversationType.GROUP } }),
        tx.conversations.create({ data: { name: 'Group 5', type: ConversationType.GROUP } }),
      ]);

      // Add user as member of all group conversations
      await tx.conversationMembers.createMany({
        data: groupConversations.map((conv) => ({
          conversationUid: conv.uid,
          userUid: userUid,
        })),
      });

      this.logger.debug(`Group conversations created`);

      const sessionConversations = await Promise.all([
        tx.conversations.create({ data: { name: 'Session 1', type: ConversationType.SESSION } }),
        tx.conversations.create({ data: { name: 'Session 2', type: ConversationType.SESSION } }),
        tx.conversations.create({ data: { name: 'Session 3', type: ConversationType.SESSION } }),
        tx.conversations.create({ data: { name: 'Session 4', type: ConversationType.SESSION } }),
        tx.conversations.create({ data: { name: 'Session 5', type: ConversationType.SESSION } }),
      ]);

      await tx.conversationMembers.createMany({
        data: sessionConversations.map((conv) => ({
          conversationUid: conv.uid,
          userUid: userUid,
        })),
      });

      this.logger.info(
        `Created ${privateConversations.length + groupConversations.length + sessionConversations.length} mock conversations for user ${userUid}`,
      );
    });
  }

  async createMessage(
    userUid: string,
    content: string,
    conversationUid: string,
    type: MessageType,
    file?: any,
  ): Promise<void> {
    const existingConversation = await this.findOne(conversationUid, userUid);

    const sessionUid = existingConversation.sessionUid ?? null;

    if (type === MessageType.TEXT) {
      return this.messagesService.createTextMessage(userUid, content, conversationUid, sessionUid);
    } else {
      return this.messagesService.createMediaMessage(
        userUid,
        conversationUid,
        type,
        file,
        sessionUid,
      );
    }
  }
}
