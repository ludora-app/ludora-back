import { FastifyRequest } from 'fastify';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { GameModePreferencesService } from '../services/game-mode-preferences.service';
import { UpdateGameModePreferenceDto } from '../dto/input/update-game-mode-preference.dto';
import { CreateGameModePreferencesDtoFromRequest } from '../dto/input/create-game-mode-preferences.dto';
import {
  GameModePreferenceResponseData,
  GameModePreferenceResponseDto,
} from '../dto/output/game-mode-preference-response.dto';

@Controller('game-mode-preferences')
@UseGuards(AuthB2CGuard)
export class GameModePreferencesController {
  constructor(private readonly gameModePreferencesService: GameModePreferencesService) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new user game mode preference' })
  @ApiCreatedResponse({ type: GameModePreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateGameModePreferencesDtoFromRequest,
    @Req() request: FastifyRequest,
  ): Promise<ResponseTypeDto<GameModePreferenceResponseData>> {
    const userUid = request['user'].uid;
    const data = await this.gameModePreferencesService.create({ ...dto, userUid });
    return { data, message: 'User game mode preference created successfully' };
  }

  @Get('my-list')
  @Protected()
  @ApiOperation({ summary: 'Get the game mode preferences of the connected user' })
  // @ApiOkResponse({ type: PaginatedGameModePreferenceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.OK)
  async findMyGameModePreferences(
    @Req() request: FastifyRequest,
  ): Promise<PaginationResponseTypeDto<GameModePreferenceResponseData>> {
    const userUid = request['user'].uid;
    const data = await this.gameModePreferencesService.findAllByUserUid(userUid);
    return { data, message: 'User game mode preferences fetched successfully' };
  }

  @Patch(':uid')
  @Protected()
  @ApiOperation({ summary: 'Update a user game mode preference by uid' })
  @ApiNoContentResponse({ description: 'User game mode preference updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('uid') uid: string,
    @Body() dto: UpdateGameModePreferenceDto,
    @Req() request: FastifyRequest,
  ): Promise<void> {
    const userUid = request['user'].uid;
    await this.gameModePreferencesService.update(uid, userUid, dto);
    return;
  }

  @Delete(':uid')
  @Protected()
  @ApiOperation({ summary: 'Delete a user game mode preference by uid' })
  @ApiNoContentResponse({ description: 'User game mode preference deleted successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('uid') uid: string, @Req() request: FastifyRequest): Promise<void> {
    const userUid = request['user'].uid;
    await this.gameModePreferencesService.remove(uid, userUid);
  }
}
