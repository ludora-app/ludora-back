import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/db/prisma.module';
import { SharedModule } from 'src/shared/shared.module';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  imports: [PrismaModule, SharedModule],
  providers: [UsersService],
})
export class UsersModule {}
