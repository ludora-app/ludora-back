import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SessionPlayers } from '@prisma/client';
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
   * @param userUid
   */
  async addDefaultPlayer(createSessionPlayerDto: CreateSessionPlayerDto): Promise<void> {
    await this.prisma.sessionPlayers.create({
      data: {
        sessionUid: createSessionPlayerDto.sessionUid,
        teamUid: createSessionPlayerDto.teamUid,
        userUid: createSessionPlayerDto.userUid,
      },
    });
    this.logger.log(
      `Default player ${createSessionPlayerDto.userUid} added to session ${createSessionPlayerDto.sessionUid}`,
    );
  }

  async addPlayerToSession(
    createSessionPlayerDto: CreateSessionPlayerDto,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.sessionPlayers.create({
      data: {
        sessionUid: createSessionPlayerDto.sessionUid,
        teamUid: createSessionPlayerDto.teamUid,
        userUid: createSessionPlayerDto.userUid,
      },
    });
    this.logger.log(
      `Player ${createSessionPlayerDto.userUid} added to session ${createSessionPlayerDto.sessionUid}`,
    );
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
}
