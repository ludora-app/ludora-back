import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { SWAGGER_TAG_SPORTS } from 'src/swagger/swagger.config';
import {
  PaginatedSportCollectionResponseDto,
  SportCollectionItemDto,
} from './dto/output/sport-collection-response.dto';
import { SportsService } from './sports.service';

@ApiTags(SWAGGER_TAG_SPORTS)
@Controller('sports')
@UseGuards(AuthB2CGuard)
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get('list/collection')
  @Protected()
  // @Header('Cache-Control', 'private, max-age=300')
  @ApiOperation({ summary: 'List the opened sports with their allowed game modes' })
  @ApiOkResponse({ type: PaginatedSportCollectionResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<PaginationResponseTypeDto<SportCollectionItemDto>> {
    const data = await this.sportsService.findAllActivated();
    return {
      data,
      message: 'Sports fetched successfully',
    };
  }
}
