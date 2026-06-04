import { Global, Module } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/storage.service';
import { UsersController } from './controllers/users.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { UsersService } from './users.service';

@Global()
@Module({
  controllers: [UsersController, UsersAdminController],
  exports: [UsersService],
  imports: [],
  providers: [UsersService, StorageService],
})
export class UsersModule {}
