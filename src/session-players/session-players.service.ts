import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SessionPlayers } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateSessionPlayerDto } from './dto/input/create-session-player.dto';

@Injectable()
export class SessionPlayersService {
  constructor(private readonly prisma: PrismaService) {}
  private logger = new Logger(SessionPlayersService.name);

  /**
   * This function adds a player to a session in a TypeScript application using Prisma for database
   * operations.
   * @param {CreateSessionPlayerDto} createSessionPlayerDto - The `createSessionPlayerDto` parameter is
   * an object that contains the following properties:
   * @param [tx] - The `tx` parameter in the `addPlayerToSession` function is an optional parameter of
   * type `Prisma.TransactionClient`. It is used to pass a transaction client to the function for
   * performing database operations within a transaction. If `tx` is provided, the function will use it
   * as the client
   */
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

  async findOne(sessionUid: string, userUid: string): Promise<SessionPlayers> {
    return this.prisma.sessionPlayers.findFirst({
      where: { sessionUid: sessionUid, userUid: userUid },
    });
  }
}
