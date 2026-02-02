import { PinoLogger } from 'nestjs-pino';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationType, MessageType } from 'generated/prisma/browser';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MessagesService } from './messages.service';
import { CreateMessageDto } from '../dto/input/create-message.dto';
import { ConversationMapper } from '../mappers/conversation.mapper';
import { ConversationFilterDto } from '../dto/input/conversation-filter.dto';
import { MessageCollectionItemDto } from '../dto/output/message-collection-response.dto';
import { CreateSessionConversationDto } from '../dto/input/create-session-conversation.dto';
import { CreatePrivateConversationDto } from '../dto/input/create-private-conversation.dto';
import { FindOneConversationResponseData } from '../dto/output/find-one-conversation-response.dto';
import { ConversationCollectionResponseData } from '../dto/output/conversation-collection-response.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly messagesService: MessagesService,
    private readonly storageService: StorageService,
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
   * @description Method called automatically when a new message is created between two users that don't have a conversation yet.
   * @param createPrivateConversationDto - The DTO containing conversation data
   * @param tx - Optional Prisma transaction client for atomic operations
   * @returns void
   */
  async createPrivateConversation(
    createPrivateConversationDto: CreatePrivateConversationDto,
    tx?: Prisma.TransactionClient,
  ): Promise<{ uid: string }> {
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

    return { uid: newConversation.uid };
  }

  async findAllByUserUid(
    filters: ConversationFilterDto,
    userUid: string,
  ): Promise<PaginatedDataDto<ConversationCollectionResponseData>> {
    const { cursor, limit, name, type } = filters;

    const query: {
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc';
          };
          select: {
            content: true;
            createdAt: true;
            uid: true;
            senderUid: true;
            updatedAt: true;
            globalStatus: true;
            type: true;
            sender: {
              select: {
                uid: true;
                firstname: true;
                lastname: true;
                imageUrl: true;
              };
            };
          };
          take: 1;
        };
        conversationMembers: {
          select: {
            user: {
              select: {
                uid: true;
                firstname: true;
                lastname: true;
                imageUrl: true;
              };
            };
          };
          where: {
            NOT: {
              userUid: string;
            };
          };
        };
        session: {
          select: {
            sessionImages: {
              select: {
                url: true;
              };
              where: {
                order: 1;
              };
            };
          };
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
        conversationMembers: {
          select: {
            user: {
              select: {
                firstname: true,
                imageUrl: true,
                lastname: true,
                uid: true,
              },
            },
          },
          where: {
            NOT: {
              userUid: userUid,
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            content: true,
            createdAt: true,
            globalStatus: true,
            sender: {
              select: {
                firstname: true,
                imageUrl: true,
                lastname: true,
                uid: true,
              },
            },
            senderUid: true,
            type: true,
            uid: true,
            updatedAt: true,
          },
          take: 1,
        },
        session: {
          select: {
            sessionImages: {
              select: {
                url: true,
              },
              where: {
                order: 1,
              },
            },
          },
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

    const rawConversations = await this.prisma.conversations.findMany(query);

    const actualLimit = limit || 10;
    let nextCursor: string | null = null;
    if (rawConversations.length > actualLimit) {
      const nextItem = rawConversations.pop();
      nextCursor = nextItem!.uid;
    }

    const conversations = await Promise.all(
      rawConversations.map((conversation) =>
        ConversationMapper.toCollectionDto(conversation, this.storageService),
      ),
    );

    return {
      items: conversations,
      nextCursor,
      totalCount: conversations.length,
    };
  }

  async findOne(
    conversationUid: string,
    userUid: string,
  ): Promise<FindOneConversationResponseData> {
    const existingConversation = await this.prisma.conversations.findUnique({
      include: {
        conversationMembers: {
          select: {
            user: {
              select: {
                firstname: true,
                imageUrl: true,
                lastname: true,
                uid: true,
              },
            },
          },
          where: {
            NOT: {
              userUid: userUid,
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            content: true,
            createdAt: true,
            globalStatus: true,
            sender: {
              select: {
                firstname: true,
                imageUrl: true,
                lastname: true,
                uid: true,
              },
            },
            senderUid: true,
            type: true,
            uid: true,
            updatedAt: true,
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

    const conversation = await ConversationMapper.toFindOneDto(
      existingConversation,
      this.storageService,
    );

    return conversation;
  }

  async createMessage(userUid: string, dto: CreateMessageDto, file?: any): Promise<void> {
    const { content, conversationUid, recipientUid, type } = dto;
    // const existingConversation = await this.findOne(conversationUid, userUid);

    //? handle the session conversation case
    let sessionConversation;
    if (dto.sessionUid) {
      sessionConversation = await this.prisma.conversations.findUnique({
        where: {
          sessionUid: dto.sessionUid,
          type: ConversationType.SESSION,
        },
      });
      if (!sessionConversation) {
        this.logger.error(`Session conversation with uid ${dto.sessionUid} not found`);
        throw new NotFoundException(`Session conversation not found`);
      }
    }

    //? handle the private conversation case
    let privateConversation;
    if (recipientUid) {
      privateConversation = await this.prisma.conversations.findFirst({
        where: {
          AND: [
            {
              conversationMembers: {
                some: {
                  userUid: userUid,
                },
              },
            },
            {
              conversationMembers: {
                some: {
                  userUid: recipientUid,
                },
              },
            },
          ],
          type: ConversationType.PRIVATE,
        },
      });
      if (!privateConversation) {
        this.logger.debug(`Private conversation not found, creating a new one`);
        privateConversation = await this.createPrivateConversation({
          type: ConversationType.PRIVATE,
          userUids: [userUid, recipientUid],
        });
      }
    }

    if (type === MessageType.TEXT) {
      return this.messagesService.createTextMessage(
        userUid,
        content,
        privateConversation?.uid ?? conversationUid,
        sessionConversation?.uid ?? null,
      );
    } else {
      return this.messagesService.createMediaMessage(
        userUid,
        privateConversation?.uid ?? conversationUid,
        type,
        file,
        sessionConversation?.uid ?? null,
      );
    }
  }

  async loadMoreMessages(
    conversationUid: string,
    userUid: string,
    cursor?: string,
    limit = 50,
  ): Promise<PaginatedDataDto<MessageCollectionItemDto>> {
    const isMember = await this.prisma.conversationMembers.findFirst({
      where: {
        conversationUid,
        userUid,
      },
    });

    if (!isMember) {
      throw new Error(`User ${userUid} is not a member of conversation ${conversationUid}`);
    }

    return await this.messagesService.getMessages(conversationUid, cursor, limit);
  }
}
