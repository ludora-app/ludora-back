import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from 'src/sessions/sessions.module';

import { SessionPlayersService } from './session-players.service';
import { SessionPlayersController } from './session-players.controller';

@Module({
  controllers: [SessionPlayersController],
  exports: [SessionPlayersService],
  imports: [forwardRef(() => SessionsModule), UsersModule],
  providers: [SessionPlayersService],
})
export class SessionPlayersModule {}
