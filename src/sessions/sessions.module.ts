import { Module } from '@nestjs/common';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ConversationMembersService } from 'src/conversations/services/conversation-members.service';
import { ConversationsService } from 'src/conversations/services/conversations.service';
import { FieldsModule } from 'src/fields/fields.module';
import { FieldSlotsService } from 'src/fields/services/field-slots.service';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { UserPreferencesModule } from 'src/user-preferences/user-preferences.module';
import { UsersModule } from 'src/users/users.module';
import { SessionInvitationsController } from './controllers/session-invitations.controller';
import { SessionPlayersController } from './controllers/session-players.controller';
import { SessionTeamsController } from './controllers/session-teams.controller';
import { SessionsController } from './controllers/sessions.controller';
import { SessionInvitationsService } from './services/session-invitations.service';
import { SessionPlayersService } from './services/session-players.service';
import { SessionTeamsService } from './services/session-teams.service';
import { SessionsService } from './services/sessions.service';

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
    ConversationMembersService,
  ],
})
export class SessionsModule {}
