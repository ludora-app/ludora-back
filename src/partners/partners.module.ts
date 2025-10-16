import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';

import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';

@Module({
  controllers: [PartnersController],
  exports: [PartnersService],
  imports: [UsersModule],
  providers: [PartnersService],
})
export class PartnersModule {}
