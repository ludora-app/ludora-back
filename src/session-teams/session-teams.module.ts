import { Module, forwardRef } from '@nestjs/common';
import { SessionsModule } from 'src/sessions/sessions.module';

import { SessionTeamsService } from './session-teams.service';
import { SessionTeamsController } from './session-teams.controller';

@Module({
  controllers: [SessionTeamsController],
  exports: [SessionTeamsService],
  imports: [forwardRef(() => SessionsModule)],
  providers: [SessionTeamsService],
})
export class SessionTeamsModule {}
