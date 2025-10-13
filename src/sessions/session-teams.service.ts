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
      where: {
        sessionUid: sessionUid,
      },
      include: {
        sessionPlayers: {
          select: {
            userUid: true,
            teamUid: true,
            user: {
              select: {
                firstname: true,
                lastname: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    const formattedTeams = SessionUtils.formatSessionPlayers(teams);

    return { items: formattedTeams, totalCount: teams.length, nextCursor: null };
  }

  async findOneByUid(uid: string): Promise<SessionTeams> {
    return this.prisma.sessionTeams.findUnique({
      where: {
        uid: uid,
      },
    });
  }
}
