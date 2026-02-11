import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  Controller,
  Get,
  Body,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { HourPreferencesService } from '../services/hour-preferences.service';
import { CreateHourPreferenceDto } from '../dto/input/create-hour-preference.dto';
import {
  PaginatedHourPreferenceResponseDto,
  HourPreferenceResponseData,
} from '../dto/output/hour-preference-response.dto';

@Controller('hour-preferences')
@UseGuards(AuthB2CGuard)
export class HourPreferencesController {
  constructor(private readonly hourPreferencesService: HourPreferencesService) {}

  @Get('/my-list')
  @Protected()
  @ApiOperation({ summary: 'Get the hour preferences of the connected user' })
  @ApiOkResponse({ type: PaginatedHourPreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findMyHourPreferences(
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<HourPreferenceResponseData>> {
    const uid = request['user'].uid;
    const data = await this.hourPreferencesService.findAllByUserUid(uid);

    if (data.items.length === 0) {
      return {
        data: null,
        message: 'User does not have any hour preferences yet',
      };
    }

    return {
      data,
      message: 'User hour preferences fetched successfully',
    };
  }

  @Put()
  @Protected()
  @ApiOperation({ summary: 'Saves the hour preferences of the connected user' })
  @ApiNoContentResponse({ description: 'User hour preferences created successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async createMany(
    @Req() request: Request,
    @Body() createHourPreferenceDto: CreateHourPreferenceDto,
  ): Promise<void> {
    const uid = request['user'].uid;

    await this.hourPreferencesService.createMany(createHourPreferenceDto.hourPreferences, uid);
  }

  @Delete()
  @Protected()
  @ApiOperation({ summary: 'Delete all the hour preferences of the connected user' })
  @ApiNoContentResponse({ description: 'User hour preference deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() request: Request): Promise<void> {
    const userUid = request['user'].uid;
    await this.hourPreferencesService.clearPreferences(userUid);
  }
}
