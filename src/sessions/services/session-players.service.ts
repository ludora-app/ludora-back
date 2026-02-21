import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserSimpleDisplayDataDto } from 'src/users/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, SessionPlayers } from 'generated/prisma/client';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { CreateSessionPlayerDto } from '../dto/input/create-session-player.dto';
import { ConversationMembersService } from './../../conversations/services/conversation-members.service';

@Injectable()
export class SessionPlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly conversationMembersService: ConversationMembersService,
  ) {
    this.logger.setContext(SessionPlayersService.name);
  }

  /**
   * This method is used in the session invitations service to add a player to a session when an invitation is accepted.
   * No verification is done here because they are done upstream.
   */
  async addPlayerToSession(
    createSessionPlayerDto: CreateSessionPlayerDto,
    creatorUid: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SessionPlayers> {
    const client = tx ?? this.prisma;
    const newPlayer = await client.sessionPlayers.create({
      data: {
        sessionUid: createSessionPlayerDto.sessionUid,
        teamUid: createSessionPlayerDto.teamUid,
        userUid: createSessionPlayerDto.userUid,
      },
      include: {
        session: {
          select: {
            conversation: {
              select: {
                uid: true,
              },
            },
          },
        },
        user: {
          select: {
            firstname: true,
            imageUrl: true,
            lastname: true,
            uid: true,
          },
        },
      },
    });
    this.logger.info(
      `Player ${createSessionPlayerDto.userUid} added to session ${createSessionPlayerDto.sessionUid}`,
    );

    if (creatorUid !== createSessionPlayerDto.userUid) {
      await this.conversationMembersService.create(
        newPlayer.session.conversation.uid,
        createSessionPlayerDto.userUid,
      );

      this.eventEmitter.emit(EventTypes.SESSION_PLAYER_ADDED, {
        creatorUid: creatorUid,
        playerAvatar: newPlayer.user.imageUrl,
        playerFirstname: newPlayer.user.firstname,
        playerLastname: newPlayer.user.lastname,
        playerUid: createSessionPlayerDto.userUid,
        sessionUid: createSessionPlayerDto.sessionUid,
      });
    }
    return newPlayer;
  }

  /**
   * This function finds players by session UID using Prisma in TypeScript.
   * @param {string} sessionUid - The `sessionUid` parameter is a string that represents the unique
   * identifier of a session. This function `findPlayersBySessionUid` is an asynchronous function that
   * returns a Promise, which resolves to an array of `Session_players` objects that are associated with
   * the provided `sessionUid`.
   * @returns The `findPlayersBySessionUid` function is returning a Promise that resolves to an array of
   * `Session_players` objects. The function uses Prisma's `findMany` method to query the database for
   * `Session_players` records that match the provided `sessionUid`.
   */
  async findPlayersBySessionUid(sessionUid: string): Promise<SessionPlayers[]> {
    return this.prisma.sessionPlayers.findMany({
      where: { sessionUid: sessionUid },
    });
  }

  async findOne(sessionUid: string, userUid: string): Promise<SessionPlayers> {
    return this.prisma.sessionPlayers.findFirst({
      where: { sessionUid: sessionUid, userUid: userUid },
    });
  }

  async suggestPlayerFromPreviousSessions(
    userUid: string,
  ): Promise<PaginatedDataDto<UserSimpleDisplayDataDto>> {
    const previousSessions = await this.prisma.sessions.findMany({
      select: {
        sessionPlayers: {
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
        },
      },
      take: 5,
      where: {
        endDate: {
          gte: new Date(),
        },
        sessionPlayers: {
          some: {
            userUid: userUid,
          },
        },
      },
    });

    let suggestedPlayers = [];
    for (const session of previousSessions) {
      for (const player of session.sessionPlayers) {
        suggestedPlayers.push(player.user);
      }
    }

    //? we only want to return 20 suggestions max
    if (suggestedPlayers.length > 20) suggestedPlayers = suggestedPlayers.slice(0, 20);
    return { items: suggestedPlayers, nextCursor: null, totalCount: suggestedPlayers.length };
  }
}
