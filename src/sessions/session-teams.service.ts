import { Injectable, Logger } from '@nestjs/common';
import { Session_teams, Team_label } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SessionTeamsService {
  constructor(private readonly prisma: PrismaService) {}
  private logger = new Logger(SessionTeamsService.name);

  async createDefaultTeams(sessionUid: string): Promise<void> {
    await this.prisma.session_teams.createMany({
      data: [
        {
          sessionId: sessionUid,
          teamLabel: Team_label.A,
          teamName: 'Team A',
        },
        {
          sessionId: sessionUid,
          teamLabel: Team_label.B,
          teamName: 'Team B',
        },
      ],
    });

    this.logger.log(`Default teams created for session ${sessionUid}`);
  }

  async findTeamsBySessionUid(
    sessionUid: string,
  ): Promise<{ items: Session_teams[]; nextCursor: string | null; totalCount: number }> {
    const teams = await this.prisma.session_teams.findMany({
      where: {
        sessionId: sessionUid,
      },
    });

    return { items: teams, totalCount: teams.length, nextCursor: null };
  }

  async findOneByUid(uid: string): Promise<Session_teams> {
    return this.prisma.session_teams.findUnique({
      where: {
        id: uid,
      },
    });
  }
}
