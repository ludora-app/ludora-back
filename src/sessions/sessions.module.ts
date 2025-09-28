import { Module } from '@nestjs/common';

import { SessionPlayersService } from './session-players.service';
import { SessionTeamsService } from './session-teams.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, SessionTeamsService, SessionTeamsService, SessionPlayersService],
})
export class SessionsModule {}
