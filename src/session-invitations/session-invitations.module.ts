import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { SessionsService } from 'src/sessions/sessions.service';
import { SessionTeamsModule } from 'src/session-teams/session-teams.module';
import { SessionPlayersService } from 'src/sessions/session-players.service';
import { SessionTeamsService } from 'src/session-teams/session-teams.service';

import { SessionInvitationsService } from './session-invitations.service';
import { SessionInvitationsController } from './session-invitations.controller';

@Module({
  controllers: [SessionInvitationsController],
  imports: [SessionsModule, UsersModule, SharedModule, SessionTeamsModule],
  providers: [
    SessionInvitationsService,
    SessionsService,
    UsersService,
    SessionPlayersService,
    SessionTeamsService,
  ],
})
export class SessionInvitationsModule {}
