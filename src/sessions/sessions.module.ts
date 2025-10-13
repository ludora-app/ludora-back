import { Module } from '@nestjs/common';

import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionTeamsService } from './session-teams.service';
import { SessionPlayersService } from './session-players.service';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, SessionTeamsService, SessionTeamsService, SessionPlayersService],
})
export class SessionsModule {}
