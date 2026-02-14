import { FastifyRequest } from 'fastify';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  Controller,
  Get,
  Param,
  Delete,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Put,
  Body,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SportPreferencesService } from '../services/sport-preferences.service';
import { CreateSportPreferenceDto } from '../dto/input/create-sport-preference.dto';
import {
  PaginatedSportPreferenceResponseDto,
  SportPreferenceResponseData,
} from '../dto/output/sport-preference.response.dto';

@Controller('sport-preferences')
@UseGuards(AuthB2CGuard)
export class SportPreferencesController {
  constructor(private readonly sportPreferencesService: SportPreferencesService) {}

  @Get('list-by-user/:userUid')
  @Protected()
  @ApiOperation({ summary: 'Get all user sport preferences by user ID' })
  @ApiOkResponse({ type: PaginatedSportPreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserUid(
    @Param('userUid') userUid: string,
  ): Promise<PaginationResponseTypeDto<SportPreferenceResponseData>> {
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
  async findMySportPreferences(
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<SportPreferenceResponseData>> {
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

  @Put()
  @Protected()
  @ApiOperation({ summary: 'Saves the sport preferences of the connected user' })
  @ApiBody({ type: CreateSportPreferenceDto })
  @ApiNoContentResponse({ description: 'User sport preferences created successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async createManyWithGameModes(
    @Req() req: FastifyRequest,
    @Body() dto: CreateSportPreferenceDto,
  ): Promise<void> {
    const userUid = req['user'].uid;
    await this.sportPreferencesService.createManyWithGameModes(dto.sportPreferences, userUid);
  }

  @Delete()
  @Protected()
  @ApiOperation({ summary: 'Delete a user sport preference by uid' })
  @ApiNoContentResponse({ description: 'User sport preference deleted successfully' })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() request: Request): Promise<void> {
    const userUid = request['user'].uid;
    await this.sportPreferencesService.clearPreferences(userUid);
  }
}
