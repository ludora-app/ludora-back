import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { ConversationsService } from 'src/conversations/conversations.service';

import { SessionsService } from './services/sessions.service';
import { SessionsController } from './controllers/sessions.controller';
import { SessionTeamsService } from './services/session-teams.service';
import { SessionPlayersService } from './services/session-players.service';
import { SessionTeamsController } from './controllers/session-teams.controller';
import { SessionPlayersController } from './controllers/session-players.controller';

@Module({
  controllers: [SessionsController, SessionPlayersController, SessionTeamsController],
  exports: [SessionsService, SessionPlayersService, SessionTeamsService],
  imports: [ConversationsModule, UsersModule, SharedModule],
  providers: [
    SessionsService,
    SessionPlayersService,
    StorageService,
    ConversationsService,
    SessionTeamsService,
  ],
})
export class SessionsModule {}
