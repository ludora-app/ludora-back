import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ConversationsService } from 'src/conversations/conversations.service';
import { SessionTeamsService } from 'src/sessions/services/session-teams.service';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { UserHourPreferencesModule } from 'src/user-hour-preferences/user-hour-preferences.module';
import { UserSportPreferencesModule } from 'src/user-sport-preferences/user-sport-preferences.module';

import { SessionInvitationsService } from './session-invitations.service';
import { SessionInvitationsController } from './session-invitations.controller';

@Module({
  controllers: [SessionInvitationsController],
  imports: [
    SessionsModule,
    UsersModule,
    SharedModule,
    ConversationsModule,
    UserSportPreferencesModule,
    UserHourPreferencesModule,
  ],
  providers: [
    SessionInvitationsService,
    UsersService,
    SessionPlayersService,
    SessionTeamsService,
    ConversationsService,
  ],
})
export class SessionInvitationsModule {}
