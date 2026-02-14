import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { ConversationMemberResponseData } from '../dto/output/conversation-member-response.dto';
import {
  ConversationMembersMapper,
  RawConversationMember,
} from '../mappers/conversation-members.mapper';
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

  async findAllByConversationUid(
    conversationUid: string,
  ): Promise<PaginatedDataDto<ConversationMemberResponseData>> {
    const members = await this.prisma.conversationMembers.findMany({
      select: {
        conversation: {
          select: {
            sessionUid: true,
          },
        },
        isAdmin: true,
        joinedAt: true,
        user: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
            uid: true,
          },
        },
      },
      where: { conversationUid },
    });
    if (members[0]?.conversation.sessionUid) {
      let membersWithSessionData = [];
      for (const member of members) {
        let memberWithSessionData = await this.prisma.sessionTeams.findMany({
          select: {
            teamLabel: true,
            teamName: true,
          },
          where: {
            sessionPlayers: {
              some: {
                userUid: member.user.uid,
              },
            },
            sessionUid: member.conversation.sessionUid,
          },
        });
        membersWithSessionData.push({
          ...member,
          sessionTeams: memberWithSessionData,
        });
      }
      const membersCollection = membersWithSessionData.map((member) =>
        ConversationMembersMapper.toDto(member),
      );
      return {
        items: membersCollection,
        totalCount: membersCollection.length,
      };
    }
    const membersCollection = members.map((member) =>
      ConversationMembersMapper.toDto(member as RawConversationMember),
    );
    return {
      items: membersCollection,
      totalCount: membersCollection.length,
    };
  }

  async updateMuteSettings(
    conversationUid: string,
    userUid: string,
    settings: MutedConversationSettingsDto,
  ): Promise<void> {
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
    await this.prisma.conversationMembers.update({
      data: {
        displayMessagesAfter: new Date(),
        isVisible: false,
      },
      where: { conversationUid_userUid: { conversationUid, userUid } },
    });
  }
}
