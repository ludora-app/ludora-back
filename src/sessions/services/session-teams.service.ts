import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, SessionTeams, TeamLabels } from 'generated/prisma/client';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';

import { SessionTeamResponseData } from '../dto/output/session-team-response';
import { SessionTeamMapper, SessionTeamWithPlayers } from '../mappers/session-team.mapper';

@Injectable()
export class SessionTeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
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
    tx?: Prisma.TransactionClient,
  ): Promise<SessionTeams[]> {
    const db = tx ?? this.prisma;

    await db.sessionTeams.createMany({
      data: [
        { sessionUid: sessionUid, teamLabel: TeamLabels.A, teamName: 'Team A' },
        { sessionUid: sessionUid, teamLabel: TeamLabels.B, teamName: 'Team B' },
      ],
    });

    this.logger.info(`Default teams created for session ${sessionUid}`);

    return db.sessionTeams.findMany({ where: { sessionUid } });
  }

  async findTeamsBySessionUid(
    sessionUid: string,
  ): Promise<PaginatedDataDto<SessionTeamResponseData>> {
    const teams = (await this.prisma.sessionTeams.findMany({
      include: {
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
      },
      where: {
        sessionUid: sessionUid,
      },
    })) as (SessionTeams & Partial<SessionTeamWithPlayers>)[];

    // Ensure sessionPlayers is always an array to avoid runtime errors if omitted in query/mocks
    const sanitizedTeams: (SessionTeams & SessionTeamWithPlayers)[] = teams.map((team) => ({
      ...team,
      sessionPlayers: Array.isArray(team.sessionPlayers) ? team.sessionPlayers : [],
    })) as (SessionTeams & SessionTeamWithPlayers)[];

    const formattedTeams = SessionTeamMapper.toDtoList(sanitizedTeams);

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
