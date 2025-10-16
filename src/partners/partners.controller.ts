import { AuthB2BGuard } from 'src/auth-b2b/guards/auth-b2b.guard';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';

@Controller('partners')
@UseGuards(AuthB2BGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }
}
