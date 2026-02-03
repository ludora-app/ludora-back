import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
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

import { SportPreferencesService } from '../services/sport-preferences.service';
import { CreateSportPreferenceDtoFromRequest } from '../dto/input/create-sport-preference.dto';
import {
  PaginatedSportPreferenceResponseDto,
  SportPreferenceResponseDto,
} from '../dto/output/sport-preference.response.dto';

@Controller('sport-preferences')
@UseGuards(AuthB2CGuard)
export class SportPreferencesController {
  constructor(private readonly sportPreferencesService: SportPreferencesService) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a user sport preference' })
  @ApiCreatedResponse({ type: ResponseTypeDto<SportPreferenceResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateSportPreferenceDtoFromRequest,
    @Req() request: Request,
  ): Promise<ResponseTypeDto<SportPreferenceResponseDto>> {
    const userUid = request['user'].uid;
    const data = await this.sportPreferencesService.create({
      ...dto,
      userUid,
    });
    return {
      data,
      message: 'User sport preference created successfully',
    };
  }

  @Get('list-by-user/:userUid')
  @Protected()
  @ApiOperation({ summary: 'Get all user sport preferences by user ID' })
  @ApiOkResponse({ type: PaginatedSportPreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserUid(@Param('userUid') userUid: string) {
    const data = await this.sportPreferencesService.findAllByUserUid(userUid);
    return {
      data,
      message: 'User sport preferences fetched successfully',
    };
  }

  @Get('my-list')
  @Protected()
  @ApiOperation({ summary: 'Get the sport preferences of the connected user' })
  @ApiOkResponse({ type: PaginatedSportPreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findMySportPreferences(@Req() request: Request) {
    const userUid = request['user'].uid;
    const data = await this.sportPreferencesService.findAllByUserUid(userUid);

    if (data.items.length === 0) {
      return {
        data: null,
        message: 'User does not have any sport preferences yet',
      };
    }

    return {
      data,
      message: 'User sport preferences fetched successfully',
    };
  }

  @Delete(':uid')
  @Protected()
  @ApiOperation({ summary: 'Delete a user sport preference by uid' })
  @ApiNoContentResponse({ description: 'User sport preference deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('uid') uid: string, @Req() request: Request): Promise<void> {
    const userUid = request['user'].uid;
    await this.sportPreferencesService.remove(uid, userUid);
  }
}
