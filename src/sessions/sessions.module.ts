import { Module, forwardRef } from '@nestjs/common';
import { SessionTeamsModule } from 'src/session-teams/session-teams.module';

import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionPlayersService } from './session-players.service';

@Module({
  controllers: [SessionsController],
  exports: [SessionsService],
  imports: [forwardRef(() => SessionTeamsModule)],
  providers: [SessionsService, SessionPlayersService],
})
export class SessionsModule {}
