import { Global, Module } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/storage.service';
import { AdminUsersController } from './controllers/admin-users.controller';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './users.service';

@Global()
@Module({
  controllers: [UsersController, AdminUsersController],
  exports: [UsersService],
  imports: [],
  providers: [UsersService, StorageService],
})
export class UsersModule {}
