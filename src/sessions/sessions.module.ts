import { Module } from '@nestjs/common';

import { SessionTeamsService } from './session-teams.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, SessionTeamsService, SessionTeamsService],
})
export class SessionsModule {}
