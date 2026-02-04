import { ApiOperation } from '@nestjs/swagger';
import { AuthB2BGuard } from 'src/auth/guards/auth-b2b.guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';

import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/input/create-partner.dto';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @UseGuards(AuthB2BGuard)
  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a partner entity' })
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }
}
