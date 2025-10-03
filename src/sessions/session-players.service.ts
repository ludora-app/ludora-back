import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionPlayerDto } from './dto/input/create-session-player.dto';

@Injectable()
export class SessionPlayersService {
  constructor(private readonly prisma: PrismaService) {}
  private logger = new Logger(SessionPlayersService.name);
  /**
   * Add the session creator as a default player to the team
   * Only use this method when creating a session so there's no need to check for the existing session and team
   * @param sessionUid
   * @param teamUid
   * @param userId
   */
  async addDefaultPlayer(createSessionPlayerDto: CreateSessionPlayerDto): Promise<void> {
    await this.prisma.session_players.create({
      data: {
        sessionId: createSessionPlayerDto.sessionUid,
        teamId: createSessionPlayerDto.teamUid,
        userId: createSessionPlayerDto.userUid,
      },
    });
    this.logger.log(
      `Default player ${createSessionPlayerDto.userUid} added to session ${createSessionPlayerDto.sessionUid}`,
    );
  }
}
