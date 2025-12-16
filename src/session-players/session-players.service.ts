import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { Prisma, SessionPlayers } from 'generated/prisma/client';
import { SessionTeamsService } from 'src/session-teams/session-teams.service';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateSessionPlayerDto } from './dto/input/create-session-player.dto';

@Injectable()
export class SessionPlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    @Inject(forwardRef(() => SessionsService))
    private readonly sessionsService: SessionsService,
    @Inject(forwardRef(() => SessionTeamsService))
    private readonly sessionTeamsService: SessionTeamsService,
  ) {
    this.logger.setContext(SessionPlayersService.name);
  }

  /**
   * This method is used in the session invitations service to add a player to a session when an invitation is accepted.
   * No verification is done here because they are done upstream.
   */
  async addPlayerToSession(
    createSessionPlayerDto: CreateSessionPlayerDto,
    tx?: Prisma.TransactionClient,
  ): Promise<SessionPlayers> {
    const client = tx ?? this.prisma;
    const newPlayer = await client.sessionPlayers.create({
      data: {
        sessionUid: createSessionPlayerDto.sessionUid,
        teamUid: createSessionPlayerDto.teamUid,
        userUid: createSessionPlayerDto.userUid,
      },
    });
    this.logger.info(
      `Player ${createSessionPlayerDto.userUid} added to session ${createSessionPlayerDto.sessionUid}`,
    );
    return newPlayer;
  }

  /**
   * This method is used to add a player to a session when a user joins a session.
   * @param createSessionPlayerDto
   */
  async joinSession(createSessionPlayerDto: CreateSessionPlayerDto): Promise<SessionPlayers> {
    const existingSession = await this.sessionsService.findOne(createSessionPlayerDto.sessionUid);

    if (!existingSession) {
      this.logger.error(`Session ${createSessionPlayerDto.sessionUid} not found`);
      throw new NotFoundException(`Session ${createSessionPlayerDto.sessionUid} not found`);
    }
    const existingTeam = await this.sessionTeamsService.findOneByUid(
      createSessionPlayerDto.teamUid,
    );

    if (!existingTeam) {
      this.logger.error(`Team ${createSessionPlayerDto.teamUid} not found`);
      throw new NotFoundException(`Team ${createSessionPlayerDto.teamUid} not found`);
    }

    if (existingSession.uid !== existingTeam.sessionUid) {
      this.logger.error(
        `Session ${createSessionPlayerDto.sessionUid} and team ${createSessionPlayerDto.teamUid} do not match`,
      );
      throw new BadRequestException(
        `Session ${createSessionPlayerDto.sessionUid} and team ${createSessionPlayerDto.teamUid} do not match`,
      );
    }

    if (existingTeam._count.sessionPlayers >= existingSession.maxPlayersPerTeam) {
      this.logger.error(`Team ${createSessionPlayerDto.teamUid} is full`);
      throw new BadRequestException(`Team ${createSessionPlayerDto.teamUid} is full`);
    }

    const existingPlayer = await this.findOne(
      createSessionPlayerDto.sessionUid,
      createSessionPlayerDto.userUid,
    );

    if (existingPlayer) {
      this.logger.error(
        `Player ${createSessionPlayerDto.userUid} already in session ${createSessionPlayerDto.sessionUid}`,
      );
      throw new BadRequestException(
        `Player ${createSessionPlayerDto.userUid} already in session ${createSessionPlayerDto.sessionUid}`,
      );
    }

    return this.addPlayerToSession(createSessionPlayerDto);
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
}
