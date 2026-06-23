import { Global, Module } from '@nestjs/common';
import { StorageService } from 'src/shared/storage/storage.service';
import { UsersController } from './controllers/users.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { UsersService } from './services/users.service';
import { UsersAdminService } from './services/users-admin.service';

@Global()
@Module({
  controllers: [UsersController, UsersAdminController],
  exports: [UsersService],
  imports: [],
  providers: [UsersService, StorageService, UsersAdminService],
})
export class UsersModule {}
