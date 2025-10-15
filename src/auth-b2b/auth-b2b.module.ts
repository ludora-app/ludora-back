import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';
import { SharedModule } from 'src/shared/shared.module';

import { AuthB2BService } from './auth-b2b.service';
import { AuthB2BController } from './auth-b2b.controller';

@Module({
  controllers: [AuthB2BController],
  imports: [UsersModule, SharedModule],
  providers: [AuthB2BService, UsersService],
})
export class AuthB2BModule {}
