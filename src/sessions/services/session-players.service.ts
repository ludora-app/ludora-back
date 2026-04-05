import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, RatingStatus, Sessions } from 'generated/prisma/browser';
import { InvitationStatus, SessionPlayers, SessionVisibility } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { EventTypes } from 'src/notifications/constants/event.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { UserSimpleDisplayData } from 'src/users/dto';
import { ConversationMembersService } from './../../conversations/services/conversation-members.service';
import { CreateSessionPlayerDto } from '../dto/input/create-session-player.dto';
import { JoinSessionResponseData } from '../dto/output/join-session-response.dto';

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
   * This method is used to add a player to a session when the user clicks on the join button.
   * @param createSessionPlayerDto
   * @param session
   * @returns
   */
  async joinSession(
    createSessionPlayerDto: CreateSessionPlayerDto,
    session: Sessions,
  ): Promise<JoinSessionResponseData> {
    await this.verifyPlayerEligibilityBeforeJoin(
      createSessionPlayerDto.userUid,
      createSessionPlayerDto.teamUid,
      session,
    );

    const newPlayer = await this.prisma.sessionPlayers.create({
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

    if (session.creatorUid !== createSessionPlayerDto.userUid) {
      await this.conversationMembersService.create(
        newPlayer.session.conversation.uid,
        createSessionPlayerDto.userUid,
      );

      this.eventEmitter.emit(EventTypes.SESSION_PLAYER_ADDED, {
        creatorUid: session.creatorUid,
        playerAvatar: newPlayer.user.imageUrl,
        playerFirstname: newPlayer.user.firstname,
        playerLastname: newPlayer.user.lastname,
        playerUid: createSessionPlayerDto.userUid,
        sessionUid: createSessionPlayerDto.sessionUid,
      });
    }
    return {
      conversationUid: newPlayer.session.conversation.uid,
      sessionUid: newPlayer.sessionUid,
    };
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

  /**
   * Checks if the users are all players of a certain session
   * @returns The `checkIfUsersArePlayers` function is returning a Promise that resolves to a boolean
   * value. This value is true if all the user UIDs in the `userUids` array are found in the
   * `sessionPlayers` table for the given `sessionUid`, and false otherwise.
   */
  async checkIfUsersArePlayers(sessionUid: string, userUids: string[]): Promise<boolean> {
    const players = await this.prisma.sessionPlayers.findMany({
      where: {
        sessionUid: sessionUid,
        userUid: {
          in: userUids,
        },
      },
      select: {
        userUid: true,
      },
    });
    return players.length === userUids.length;
  }

  async findOne(sessionUid: string, userUid: string): Promise<SessionPlayers> {
    return this.prisma.sessionPlayers.findFirst({
      where: { sessionUid: sessionUid, userUid: userUid },
    });
  }

  async suggestPlayerFromPreviousSessions(
    userUid: string,
  ): Promise<PaginatedDataDto<UserSimpleDisplayData>> {
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

  async leaveSession(session: Sessions, userUid: string): Promise<void> {
    if (session.startDate < new Date()) {
      throw new BadRequestException('You cannot leave a session after it has started');
    }

    const player = await this.prisma.sessionPlayers.findUnique({
      where: {
        sessionUid_userUid: {
          sessionUid: session.uid,
          userUid,
        },
      },
    });
    if (!player) {
      throw new BadRequestException('You are not a player of this session');
    }
    await this.prisma.sessionPlayers.delete({
      where: {
        sessionUid_userUid: {
          sessionUid: session.uid,
          userUid,
        },
      },
    });

    const sessionConversation = await this.prisma.conversations.findFirst({
      where: {
        sessionUid: session.uid,
      },
    });

    await this.prisma.conversationMembers.delete({
      where: {
        conversationUid_userUid: {
          conversationUid: sessionConversation.uid,
          userUid,
        },
      },
    });
    this.logger.debug(`Player ${userUid} left session ${session.uid}`);
  }

  async switchPlayerToAnotherTeam(
    session: Sessions,
    userUid: string,
    teamUid: string,
  ): Promise<void> {
    const existingTeam = await this.prisma.sessionTeams.findUnique({
      where: {
        sessionUid: session.uid,
        uid: teamUid,
      },
    });

    if (!existingTeam) {
      throw new BadRequestException('Team not found');
    }

    const existingPlayer = await this.prisma.sessionPlayers.findUnique({
      where: {
        sessionUid_userUid: {
          sessionUid: session.uid,
          userUid,
        },
      },
    });

    if (!existingPlayer) {
      throw new BadRequestException('Player not found');
    }

    if (existingPlayer.teamUid === teamUid) {
      throw new BadRequestException('Player already on this team');
    }

    await this.prisma.sessionPlayers.update({
      data: {
        teamUid,
      },
      where: {
        sessionUid_userUid: {
          sessionUid: session.uid,
          userUid,
        },
      },
    });

    this.logger.debug(`Player ${userUid} switched to team ${teamUid} in session ${session.uid}`);
  }

  /**
   * Verifies if a player is eligible to join a session.
   * @param playerUid The UID of the player to verify.
   * @param teamUid The UID of the team the player wants to join.
   * @param session The session to verify the player's eligibility for.
   */
  async verifyPlayerEligibilityBeforeJoin(playerUid: string, teamUid: string, session: Sessions) {
    //? If the session is private, we need to check if the user is a friend of the session creator
    if (session.visibility === SessionVisibility.PRIVATE) {
      const existingFriendship = await this.prisma.friends.findFirst({
        where: {
          AND: [
            {
              OR: [
                {
                  userUid1: playerUid,
                  userUid2: session.creatorUid,
                },
                {
                  userUid1: session.creatorUid,
                  userUid2: playerUid,
                },
              ],
            },
            {
              status: InvitationStatus.ACCEPTED,
            },
          ],
        },
      });
      if (!existingFriendship)
        throw new ForbiddenException('You are not a friend of the session creator');
    }

    //? Check if the team exists and if it is full
    const existingTeam = await this.prisma.sessionTeams.findUnique({
      select: {
        _count: { select: { sessionPlayers: true } },
        sessionUid: true,
      },
      where: { uid: teamUid, sessionUid: session.uid },
    });

    if (!existingTeam) {
      this.logger.error(`Team ${teamUid} not found`);
      throw new NotFoundException(`Team ${teamUid} not found`);
    }

    if (existingTeam._count.sessionPlayers >= session.maxPlayersPerTeam) {
      this.logger.error(`Team ${teamUid} is full`);
      throw new BadRequestException(`Team ${teamUid} is full`);
    }

    //? Checks if the user isn't already a player in the session
    const existingPlayer = await this.prisma.sessionPlayers.findFirst({
      where: { userUid: playerUid, sessionUid: session.uid },
    });

    if (existingPlayer) {
      this.logger.error(`Player ${playerUid} already in session ${session.uid}`);
      throw new BadRequestException(`Player ${playerUid} already in session ${session.uid}`);
    }

    const existingPlayerUids = (
      await this.prisma.sessionPlayers.findMany({
        select: { userUid: true },
        where: { sessionUid: session.uid },
      })
    ).map((p) => p.userUid);

    if (existingPlayerUids.length > 0) {
      const block = await this.prisma.userBlocks.findFirst({
        where: {
          OR: [
            { blockedUid: { in: existingPlayerUids }, blockerUid: playerUid },
            { blockedUid: playerUid, blockerUid: { in: existingPlayerUids } },
          ],
        },
      });
      if (block) {
        this.logger.warn(
          `Block relationship detected, user ${playerUid} cannot join session ${session.uid}`,
        );
        throw new ForbiddenException('Action not allowed due to blocked user relationship');
      }
    }
  }
  /**
   * Updates the rating status of a player in a session
   * @param playerUid
   * @param sessionUid
   * @param status
   * @returns
   */
  async updateRatingStatus(
    playerUid,
    sessionUid,
    status: RatingStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const _prisma = tx ?? this.prisma;

    const player = await _prisma.sessionPlayers.findUnique({
      where: {
        sessionUid_userUid: {
          sessionUid: sessionUid,
          userUid: playerUid,
        },
      },
    });

    if (!player) {
      throw new BadRequestException('Player not found');
    }

    if (player.ratingStatus === status) {
      return;
    }

    if (
      (player.ratingStatus === RatingStatus.VALIDATED && status === RatingStatus.PENDING) ||
      (player.ratingStatus === RatingStatus.VALIDATED && status === RatingStatus.REFUSED) ||
      (player.ratingStatus === RatingStatus.REFUSED && status === RatingStatus.PENDING)
    ) {
      this.logger.error(
        `Cannot update ratingStatus from ${player.ratingStatus} to ${status} for user ${playerUid} in session ${sessionUid}`,
      );
      throw new BadRequestException('You cannot unvalidate a rating');
    }
    await _prisma.sessionPlayers.update({
      where: {
        sessionUid_userUid: {
          sessionUid: sessionUid,
          userUid: playerUid,
        },
      },
      data: {
        ratingStatus: status,
      },
    });
  }
}
