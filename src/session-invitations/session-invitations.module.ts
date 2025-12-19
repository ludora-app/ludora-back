import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { SessionsService } from 'src/sessions/sessions.service';
import { SessionTeamsModule } from 'src/session-teams/session-teams.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { SessionTeamsService } from 'src/session-teams/session-teams.service';
import { ConversationsService } from 'src/conversations/conversations.service';
import { SessionPlayersModule } from 'src/session-players/session-players.module';
import { SessionPlayersService } from 'src/session-players/session-players.service';
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
    SessionTeamsModule,
    SessionPlayersModule,
    ConversationsModule,
    UserSportPreferencesModule,
    UserHourPreferencesModule,
  ],
  providers: [
    SessionInvitationsService,
    SessionsService,
    UsersService,
    SessionPlayersService,
    SessionTeamsService,
    ConversationsService,
  ],
})
export class SessionInvitationsModule {}
