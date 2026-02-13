import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';

import {
  ArchivedConversationSettingsDto,
  MutedConversationSettingsDto,
} from '../dto/input/update-conversation-settings.dto';

@Injectable()
export class ConversationMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConversationMembersService.name);
  }

  async create(conversationUid: string, userUid: string): Promise<void> {
    await this.prisma.conversationMembers.create({
      data: {
        conversationUid: conversationUid,
        userUid: userUid,
      },
    });
  }

  async createMany(conversationUid: string, userUids: string[]): Promise<void> {
    await this.prisma.conversationMembers.createMany({
      data: userUids.map((userUid) => ({
        conversationUid: conversationUid,
        userUid: userUid,
      })),
    });
  }

  async isMember(conversationUid: string, userUid: string): Promise<boolean> {
    const member = await this.prisma.conversationMembers.findFirst({
      where: {
        conversationUid: conversationUid,
        userUid: userUid,
      },
    });
    return !!member;
  }

  async updateMuteSettings(
    conversationUid: string,
    userUid: string,
    settings: MutedConversationSettingsDto,
  ): Promise<void> {
    const isMember = await this.isMember(conversationUid, userUid);

    if (!isMember) {
      this.logger.error(`User ${userUid} is not a member of conversation ${conversationUid}`);
      throw new ForbiddenException(`Action not allowed`);
    }

    await this.prisma.conversationMembers.update({
      data: settings,
      where: { conversationUid_userUid: { conversationUid, userUid } },
    });
    this.logger.debug(
      `Updated muted settings for user ${userUid} in conversation ${conversationUid} to ${settings.isMuted}`,
    );
  }

  async updateArchivedSettings(
    conversationUid: string,
    userUid: string,
    settings: ArchivedConversationSettingsDto,
  ): Promise<void> {
    const isMember = await this.isMember(conversationUid, userUid);

    if (!isMember) {
      this.logger.error(`User ${userUid} is not a member of conversation ${conversationUid}`);
      throw new ForbiddenException(`Action not allowed`);
    }

    await this.prisma.conversationMembers.update({
      data: settings,
      where: { conversationUid_userUid: { conversationUid, userUid } },
    });
    this.logger.debug(
      `Updated archived settings for user ${userUid} in conversation ${conversationUid} to ${settings.isArchived}`,
    );
  }
  /**
   * @description Method called when a user deletes a conversation, it updates the display messages after to the current date.
   * @param conversationUid - The conversation uid
   * @param userUid - The user uid
   * @returns void
   */
  async updateDisplayMessagesAfterDeletion(
    conversationUid: string,
    userUid: string,
  ): Promise<void> {
    const isMember = await this.isMember(conversationUid, userUid);

    if (!isMember) {
      this.logger.error(`User ${userUid} is not a member of conversation ${conversationUid}`);
      throw new ForbiddenException(`Action not allowed`);
    }

    await this.prisma.conversationMembers.update({
      data: {
        displayMessagesAfter: new Date(),
        isVisible: false,
      },
      where: { conversationUid_userUid: { conversationUid, userUid } },
    });
  }
}
