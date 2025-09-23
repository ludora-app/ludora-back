import { Module } from '@nestjs/common';
import { SessionsModule } from 'src/sessions/sessions.module';
import { SessionsService } from 'src/sessions/sessions.service';
import { SharedModule } from 'src/shared/shared.module';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, SessionsService, UsersService],
  imports: [SessionsModule, UsersModule, SharedModule],
})
export class InvitationsModule {}
