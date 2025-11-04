import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { SessionTeamsModule } from 'src/session-teams/session-teams.module';
import { SessionPlayersModule } from 'src/session-players/session-players.module';

import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  controllers: [SessionsController],
  exports: [SessionsService],
  imports: [
    forwardRef(() => SessionTeamsModule),
    forwardRef(() => SessionPlayersModule),
    UsersModule,
    SharedModule,
  ],
  providers: [SessionsService, StorageService],
})
export class SessionsModule {}
