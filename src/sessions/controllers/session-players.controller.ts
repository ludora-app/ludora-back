import { UserSimpleDisplayDataDto } from 'src/users/dto';
import { SessionPlayers } from 'generated/prisma/browser';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SessionsService } from '../services/sessions.service';
import { JoinSessionDto } from '../dto/input/create-session-player.dto';
import { SessionPlayersService } from '../services/session-players.service';
import { PlayerSuggestionResponseDto } from '../dto/output/player-suggestion-response.dto';

@Controller('session-players')
@UseGuards(AuthB2CGuard)
export class SessionPlayersController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly playersService: SessionPlayersService,
  ) {}

  @Post('join')
  @Protected()
  @ApiOperation({ summary: 'Allows a user to join a session' })
  //   @ApiCreatedResponse({ type: ResponseTypeDto<SessionPlayers> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async joinSession(
    @Req() request: Request,
    @Body() joinSessionDto: JoinSessionDto,
  ): Promise<ResponseTypeDto<SessionPlayers>> {
    const userUid = request['user'].uid;
    const newPlayer = await this.sessionsService.joinSession({ ...joinSessionDto, userUid });
    return {
      data: newPlayer,
      message: 'Player joined session successfully',
    };
  }

  @Get('suggestion-list/collection')
  @Protected()
  @ApiOperation({
    summary: 'Returns a maximum of 20 players from previous sessions played by the connected user',
  })
  @ApiOkResponse({ type: PlayerSuggestionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async suggestPlayerFromPreviousSessions(
    @Req() request: Request,
  ): Promise<PaginationResponseTypeDto<UserSimpleDisplayDataDto>> {
    const userUid = request['user'].uid;
    const data = await this.playersService.suggestPlayerFromPreviousSessions(userUid);
    return {
      data,
      message: 'Players suggested successfully',
    };
  }
}
