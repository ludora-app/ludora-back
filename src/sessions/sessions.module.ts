import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { FieldsModule } from 'src/fields/fields.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { FieldSlotsService } from 'src/fields/services/field-slots.service';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { UserPreferencesModule } from 'src/user-preferences/user-preferences.module';
import { ConversationsService } from 'src/conversations/services/conversations.service';

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
  imports: [ConversationsModule, UsersModule, SharedModule, UserPreferencesModule, FieldsModule],
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
