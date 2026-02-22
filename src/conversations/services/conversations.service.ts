import { PinoLogger } from 'nestjs-pino';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { ConversationType, MessageStatus, MessageType } from 'generated/prisma/browser';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MessagesService } from './messages.service';
import { CreateMessageDto } from '../dto/input/create-message.dto';
import { ConversationMapper } from '../mappers/conversation.mapper';
import { ConversationMembersService } from './conversation-members.service';
import { ConversationFilterDto } from '../dto/input/conversation-filter.dto';
import { UnreadMessagesResponseData } from '../dto/output/unread-messages-response.dto';
import { MessageCollectionItemDto } from '../dto/output/message-collection-response.dto';
import { CreatePrivateConversationDto } from '../dto/input/create-private-conversation.dto';
import { CreateSessionConversationDto } from '../dto/input/create-session-conversation.dto';
import { FindOneConversationResponseData } from '../dto/output/find-one-conversation-response.dto';
import { ConversationCollectionResponseData } from '../dto/output/conversation-collection-response.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly messagesService: MessagesService,
    private readonly conversationMembersService: ConversationMembersService,
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

    await this.conversationMembersService.create(
      newConversation.uid,
      createConversationDto.userUid,
      tx,
    );

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

    await this.conversationMembersService.createMany(
      newConversation.uid,
      createPrivateConversationDto.userUids,
      tx,
    );
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
        _count: {
          select: {
            messages: {
              where: {
                messageReceipts: {
                  some: {
                    userUid: string;
                    status: { notIn: MessageStatus[] };
                  };
                };
              };
            };
          };
        };
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
            sport: true;
            sessionImages: {
              select: {
                url: true;
              };
              where: {
                order: 1;
              };
            };
            sessionTeams: {
              select: {
                teamName: true;
                teamLabel: true;
              };
              where: {
                sessionPlayers: {
                  some: {
                    userUid: string;
                  };
                };
              };
            };
          };
        };
      };
      take: number;
      orderBy?: {
        updatedAt: 'desc';
      };
      skip?: number;
      cursor?: {
        uid: string;
      };
      where: {
        conversationMembers: {
          some: {
            userUid: string;
            isVisible: true;
            isArchived: false;
          };
        };
        type?: ConversationType;
        name?: {
          contains: string;
          mode: 'insensitive';
        };
        AND?: Prisma.ConversationsWhereInput[];
        OR?: Prisma.ConversationsWhereInput[];
      };
    } = {
      include: {
        _count: {
          select: {
            messages: {
              where: {
                messageReceipts: {
                  some: {
                    status: { notIn: [MessageStatus.READ, MessageStatus.SENT] },
                    userUid: userUid,
                  },
                },
              },
            },
          },
        },
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
            sessionTeams: {
              select: {
                teamLabel: true,
                teamName: true,
              },
              where: {
                sessionPlayers: {
                  some: {
                    userUid: userUid,
                  },
                },
              },
            },
            sport: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit ? limit + 1 : 10,
      where: {
        conversationMembers: {
          some: {
            isArchived: false,
            isVisible: true,
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
      const nameFilter = { contains: name, mode: 'insensitive' as const };

      if (type === ConversationType.SESSION || type === ConversationType.GROUP) {
        // SESSION/GROUP: name comes from conversation.name
        query.where.name = nameFilter;
      } else if (type === ConversationType.PRIVATE) {
        // PRIVATE: name is computed from the other user (non-connected)
        query.where.AND = [
          ...(query.where.AND ?? []),
          {
            conversationMembers: {
              some: {
                user: {
                  OR: [{ firstname: nameFilter }, { lastname: nameFilter }],
                },
                userUid: { not: userUid },
              },
            },
          },
        ];
      } else {
        // No type filter: match SESSION/GROUP by name OR PRIVATE by other user's name
        query.where.OR = [
          { name: nameFilter, type: ConversationType.SESSION },
          { name: nameFilter, type: ConversationType.GROUP },
          {
            conversationMembers: {
              some: {
                user: {
                  OR: [{ firstname: nameFilter }, { lastname: nameFilter }],
                },
                userUid: { not: userUid },
              },
            },
            type: ConversationType.PRIVATE,
          },
        ];
      }
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
        ConversationMapper.toCollectionDto(conversation, userUid),
      ),
    );

    return {
      items: conversations,
      nextCursor,
      totalCount: conversations.length,
    };
  }

  async hasUnreadMessages(userUid: string): Promise<UnreadMessagesResponseData> {
    const unreadCount = await this.prisma.messageReceipts.count({
      where: {
        message: {
          conversation: {
            conversationMembers: {
              some: {
                isArchived: false,
                isVisible: true,
                userUid,
              },
            },
          },
          senderUid: { not: userUid },
        },
        status: { notIn: [MessageStatus.READ, MessageStatus.SENT] },
        userUid,
      },
    });

    return { hasUnreadMessages: unreadCount > 0 };
  }

  async findOne(
    conversationUid: string,
    userUid: string,
  ): Promise<FindOneConversationResponseData> {
    const existingConversation = await this.prisma.conversations.findUnique({
      include: {
        conversationMembers: {
          select: {
            isArchived: true,
            isMuted: true,
            user: {
              select: {
                firstname: true,
                imageUrl: true,
                lastname: true,
                uid: true,
              },
            },
            userUid: true,
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
            senderUid: true,
            type: true,
            uid: true,
            updatedAt: true,
          },
          take: 10,
        },
        session: {
          select: {
            sessionImages: {
              select: {
                url: true,
              },
            },
            sessionTeams: {
              select: {
                teamLabel: true,
                teamName: true,
              },
              where: {
                sessionPlayers: {
                  some: {
                    userUid: userUid,
                  },
                },
              },
            },
            sport: true,
          },
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

    const conversation = await ConversationMapper.toFindOneDto(existingConversation, userUid);

    return conversation;
  }

  async findByUserUids(
    connectedUserUid: string,
    otherUserUid: string,
  ): Promise<{ conversationUid: string }> {
    const existingConversation = await this.prisma.conversations.findFirst({
      select: {
        uid: true,
      },
      where: {
        AND: [
          {
            conversationMembers: {
              some: { userUid: connectedUserUid },
            },
          },
          {
            conversationMembers: {
              some: { userUid: otherUserUid },
            },
          },
        ],
        type: ConversationType.PRIVATE,
      },
    });
    if (existingConversation) {
      return { conversationUid: existingConversation.uid };
    }

    return { conversationUid: null };
  }

  async createMessage(
    userUid: string,
    dto: CreateMessageDto,
    file?: any,
  ): Promise<{ conversationUid: string; messageUid: string }> {
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

    const actualConversationUid = privateConversation?.uid ?? conversationUid;
    let message: { messageUid: string } | undefined;

    if ((type as MessageType) === MessageType.TEXT) {
      message = await this.messagesService.createTextMessage(
        userUid,
        content,
        actualConversationUid,
        sessionConversation?.uid ?? null,
      );
    } else {
      message = await this.messagesService.createMediaMessage(
        userUid,
        actualConversationUid,
        type,
        file,
        sessionConversation?.uid ?? null,
      );
    }

    return { conversationUid: actualConversationUid, messageUid: message?.messageUid };
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

    return await this.messagesService.getMessages(conversationUid, userUid, cursor, limit);
  }
}
