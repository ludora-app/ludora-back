import { PinoLogger } from 'nestjs-pino';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';

import { UpdateConversationDto } from './dto/input/update-conversation.dto';
import { CreateSessionConversationDto } from './dto/input/create-session-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
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

  findAll() {
    return `This action returns all conversations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }
}
