import { Injectable } from '@nestjs/common';
import { Prisma, SessionTeams, TeamLabels } from 'generated/prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { StorageService } from 'src/shared/storage/storage.service';

import { SessionTeamResponseData } from '../dto/output/session-team-response';
import { SessionTeamMapper, SessionTeamWithPlayers } from '../mappers/session-team.mapper';

@Injectable()
export class SessionTeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly storageService: StorageService,
  ) {
    this.logger.setContext(SessionTeamsService.name);
  }

  /**
   * @description The function `createDefaultTeams` creates default teams for a session and returns their UIDs.
   * It is used to create default teams for a session when a session is created.
   * @param {string} sessionUid - The `sessionUid` parameter is a unique identifier for the session for
   * which default teams are being created.
   * @param {Prisma.TransactionClient} tx - The `tx` parameter is an optional parameter that allows you to
   * pass a custom transaction client to the function. If not provided, the default transaction client will
   * be used.
   * @returns The `createDefaultTeams` function returns a Promise that resolves to an array of objects,
   * where each object has a `uid` property.
   */
  async createDefaultTeams(
    sessionUid: string,
    teamAName: string,
    teamBName: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SessionTeams[]> {
    const db = tx ?? this.prisma;

    await db.sessionTeams.createMany({
      data: [
        { sessionUid: sessionUid, teamLabel: TeamLabels.A, teamName: teamAName },
        { sessionUid: sessionUid, teamLabel: TeamLabels.B, teamName: teamBName },
      ],
    });

    this.logger.info(`Default teams created for session ${sessionUid}`);

    return db.sessionTeams.findMany({ where: { sessionUid } });
  }

  async findTeamsBySessionUid(
    sessionUid: string,
    userUid: string,
  ): Promise<PaginatedDataDto<SessionTeamResponseData>> {
    const session = await this.prisma.sessions.findUnique({
      select: {
        maxPlayersPerTeam: true,
        sport: true,
      },
      where: { uid: sessionUid },
    });

    const teams = (await this.prisma.sessionTeams.findMany({
      include: {
        sessionPlayers: {
          select: {
            teamUid: true,
            user: {
              select: {
                bio: true,
                firstname: true,
                imageUrl: true,
                lastname: true,
                userSportPreferences: {
                  select: {
                    level: true,
                  },
                  where: {
                    sport: session?.sport,
                  },
                },
              },
            },
            userUid: true,
          },
        },
      },
      where: {
        sessionUid: sessionUid,
      },
    })) as (SessionTeams & Partial<SessionTeamWithPlayers>)[];

    // Process signed URLs for player images and add isJoined flag
    const teamsWithSignedUrls = await Promise.all(
      teams.map(async (team) => {
        const sessionPlayers = Array.isArray(team.sessionPlayers) ? team.sessionPlayers : [];
        return {
          ...team,
          isJoined: userUid ? sessionPlayers.some((player) => player.userUid === userUid) : false,
          sessionPlayers: await Promise.all(
            sessionPlayers.map(async (player) => ({
              ...player,
              sportLevel: player.user.userSports?.[0]?.level ?? null,
              user: {
                ...player.user,
                imageUrl: player.user.imageUrl ?? null,
              },
            })),
          ),
        };
      }),
    );

    const formattedTeams = SessionTeamMapper.toDtoList(
      teamsWithSignedUrls,
      session?.maxPlayersPerTeam,
    );

    return {
      items: formattedTeams,
      nextCursor: null,
      totalCount: teams.length,
    };
  }

  async findOneByUid(uid: string): Promise<SessionTeamResponseData | null> {
    const team = await this.prisma.sessionTeams.findUnique({
      select: {
        sessionPlayers: {
          select: {
            teamUid: true,
            user: {
              select: {
                firstname: true,
                imageUrl: true,
                lastname: true,
              },
            },
            userUid: true,
          },
        },
        sessionUid: true,
        teamLabel: true,
        teamName: true,
      },

      where: {
        uid: uid,
      },
    });

    if (!team) {
      return null;
    }

    return SessionTeamMapper.toDto(team as unknown as SessionTeamWithPlayers);
  }
}
