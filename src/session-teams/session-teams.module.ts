import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from 'src/sessions/sessions.module';

import { SessionTeamsService } from './session-teams.service';
import { SessionTeamsController } from './session-teams.controller';

@Module({
  controllers: [SessionTeamsController],
  exports: [SessionTeamsService],
  imports: [forwardRef(() => SessionsModule), UsersModule],
  providers: [SessionTeamsService],
})
export class SessionTeamsModule {}
