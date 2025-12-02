import { AuthB2BGuard } from 'src/auth-b2b/guards/auth-b2b.guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';

import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @UseGuards(AuthB2BGuard)
  @Post()
  @Protected()
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }
}
