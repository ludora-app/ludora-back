import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { SessionTeamsModule } from 'src/session-teams/session-teams.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ConversationsService } from 'src/conversations/conversations.service';
import { SessionPlayersModule } from 'src/session-players/session-players.module';
import { UserHourPreferencesModule } from 'src/user-hour-preferences/user-hour-preferences.module';
import { UserSportPreferencesModule } from 'src/user-sport-preferences/user-sport-preferences.module';

import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  controllers: [SessionsController],
  exports: [SessionsService],
  imports: [
    forwardRef(() => SessionTeamsModule),
    forwardRef(() => SessionPlayersModule),
    ConversationsModule,
    UsersModule,
    SharedModule,
    UserSportPreferencesModule,
    UserHourPreferencesModule,
  ],
  providers: [SessionsService, StorageService, ConversationsService],
})
export class SessionsModule {}
