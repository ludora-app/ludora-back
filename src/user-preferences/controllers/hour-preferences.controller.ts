import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
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
  HourPreferenceResponseDto,
} from '../dto/output/hour-preference-response.dto';

@Controller('hour-preferences')
@UseGuards(AuthB2CGuard)
export class HourPreferencesController {
  constructor(private readonly hourPreferencesService: HourPreferencesService) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new user hour preference' })
  @ApiCreatedResponse({ type: ResponseTypeDto<HourPreferenceResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() request: Request,
    @Body() createHourPreferenceDto: CreateHourPreferenceDto,
  ): Promise<ResponseTypeDto<HourPreferenceResponseDto>> {
    const uid = request['user'].uid;

    const data = await this.hourPreferencesService.create(uid, createHourPreferenceDto);

    return { data, message: 'User hour preference created successfully' };
  }

  @Get('list-by-user/:userUid')
  @Protected()
  @ApiOperation({ summary: 'Get all user hour preferences by user ID' })
  @ApiOkResponse({ type: PaginatedHourPreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserUid(
    @Param('userUid') userUid: string,
  ): Promise<PaginationResponseTypeDto<HourPreferenceResponseDto>> {
    const data = await this.hourPreferencesService.findAllByUserUid(userUid);
    return {
      data,
      message: 'User hour preferences fetched successfully',
    };
  }

  @Get('/my-list')
  @Protected()
  @ApiOperation({ summary: 'Get the hour preferences of the connected user' })
  @ApiOkResponse({ type: PaginatedHourPreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findMyHourPreferences(
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<HourPreferenceResponseDto>> {
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

  @Delete(':uid')
  @Protected()
  @ApiOperation({ summary: 'Delete a user hour preference by uid' })
  @ApiNoContentResponse({ description: 'User hour preference deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('uid') uid: string, @Req() request: Request): Promise<void> {
    const userUid = request['user'].uid;
    await this.hourPreferencesService.remove(uid, userUid);
  }
}
