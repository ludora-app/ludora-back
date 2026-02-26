import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { StorageService } from 'src/shared/storage/storage.service';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  controllers: [FriendsController],
  imports: [UsersModule, SharedModule],
  providers: [FriendsService, UsersService, StorageService],
})
export class FriendsModule {}
