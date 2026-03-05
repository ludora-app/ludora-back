import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  controllers: [ModerationController],
  imports: [UsersModule],
  providers: [ModerationService],
})
export class ModerationModule {}
