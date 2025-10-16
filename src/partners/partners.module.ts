import { Module } from '@nestjs/common';

import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';

@Module({
  controllers: [PartnersController],
  exports: [PartnersService],
  providers: [PartnersService],
})
export class PartnersModule {}
