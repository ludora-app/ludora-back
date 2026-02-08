import { FastifyRequest } from 'fastify';
import { ApiOperation } from '@nestjs/swagger';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { HourPreferencesService } from '../services/hour-preferences.service';
import { SportPreferencesService } from '../services/sport-preferences.service';
import { CreateAllPreferencesDto } from '../dto/input/create-all-preferences.dto';
import { GameModePreferencesService } from '../services/game-mode-preferences.service';

@Controller('user-preferences')
@UseGuards(AuthB2CGuard)
export class UserPreferencesController {
  constructor(
    private readonly sportService: SportPreferencesService,
    private readonly hourService: HourPreferencesService,
    private readonly gameModeService: GameModePreferencesService,
  ) {}

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create all user preferences (sports with game modes)' })
  async createAllPreferences(
    @Req() req: FastifyRequest,
    @Body() dto: CreateAllPreferencesDto,
  ): Promise<void> {
    const userUid = req['user'].uid;
    await this.sportService.createManyWithGameModes(dto.sportPreferences, userUid);
  }
}
