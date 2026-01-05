import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';

import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';

@Module({
  controllers: [FriendsController],
  imports: [UsersModule, SharedModule],
  providers: [FriendsService, UsersService, StorageService],
})
export class FriendsModule {}
