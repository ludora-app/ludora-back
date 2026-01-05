import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { FieldSlotsService } from 'src/fields/services/field-slots.service';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ConversationsService } from 'src/conversations/conversations.service';
import { UserHourPreferencesModule } from 'src/user-hour-preferences/user-hour-preferences.module';
import { UserSportPreferencesModule } from 'src/user-sport-preferences/user-sport-preferences.module';

import { SessionsService } from './services/sessions.service';
import { SessionsController } from './controllers/sessions.controller';
import { SessionTeamsService } from './services/session-teams.service';
import { SessionPlayersService } from './services/session-players.service';
import { SessionTeamsController } from './controllers/session-teams.controller';
import { SessionInvitationsService } from './services/session-invitations.service';
import { SessionPlayersController } from './controllers/session-players.controller';
import { SessionInvitationsController } from './controllers/session-invitations.controller';

@Module({
  controllers: [
    SessionsController,
    SessionInvitationsController,
    SessionPlayersController,
    SessionTeamsController,
  ],
  exports: [SessionsService, SessionPlayersService, SessionTeamsService, SessionInvitationsService],
  imports: [
    ConversationsModule,
    UsersModule,
    SharedModule,
    UserHourPreferencesModule,
    UserSportPreferencesModule,
  ],
  providers: [
    SessionsService,
    SessionPlayersService,
    StorageService,
    ConversationsService,
    SessionTeamsService,
    SessionInvitationsService,
    FieldSlotsService,
  ],
})
export class SessionsModule {}
