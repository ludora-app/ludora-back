import { Injectable, Logger } from '@nestjs/common';
import { SessionTeams, Team_label } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { SessionUtils } from './utils/session-utils';

@Injectable()
export class SessionTeamsService {
  constructor(private readonly prisma: PrismaService) {}
  private logger = new Logger(SessionTeamsService.name);

  async createDefaultTeams(sessionUid: string): Promise<void> {
    await this.prisma.sessionTeams.createMany({
      data: [
        {
          sessionUid: sessionUid,
          teamLabel: Team_label.A,
          teamName: 'Team A',
        },
        {
          sessionUid: sessionUid,
          teamLabel: Team_label.B,
          teamName: 'Team B',
        },
      ],
    });

    this.logger.log(`Default teams created for session ${sessionUid}`);
  }

  async findTeamsBySessionUid(
    sessionUid: string,
  ): Promise<{ items: SessionTeams[]; nextCursor: string | null; totalCount: number }> {
    const teams = await this.prisma.sessionTeams.findMany({
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
    });

    const formattedTeams = teams.map((team) => SessionUtils.formatSessionPlayers(team));

    return { items: formattedTeams, nextCursor: null, totalCount: teams.length };
  }

  async findOneByUid(uid: string): Promise<SessionTeams> {
    return this.prisma.sessionTeams.findUnique({
      where: {
        uid: uid,
      },
    });
  }
}
