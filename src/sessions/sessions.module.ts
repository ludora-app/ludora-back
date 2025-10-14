import { Module, forwardRef } from '@nestjs/common';
import { SessionTeamsModule } from 'src/session-teams/session-teams.module';
import { SessionPlayersModule } from 'src/session-players/session-players.module';

import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  controllers: [SessionsController],
  exports: [SessionsService],
  imports: [forwardRef(() => SessionTeamsModule), forwardRef(() => SessionPlayersModule)],
  providers: [SessionsService],
})
export class SessionsModule {}
