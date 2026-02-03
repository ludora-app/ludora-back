import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GameModePreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly usersService: UsersService,
  ) {
    this.logger.setContext(GameModePreferencesService.name);
  }
}
