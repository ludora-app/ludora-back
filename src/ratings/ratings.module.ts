import { Module } from '@nestjs/common';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { FieldsModule } from 'src/fields/fields.module';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { SessionsService } from 'src/sessions/services/sessions.service';
import { SessionsModule } from 'src/sessions/sessions.module';
import { UserPreferencesModule } from 'src/user-preferences/user-preferences.module';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  controllers: [RatingsController],
  imports: [SessionsModule, ConversationsModule, UserPreferencesModule, FieldsModule],
  providers: [RatingsService, SessionsService, SessionPlayersService],
})
export class RatingsModule {}
