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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { Sessions } from 'generated/prisma/client';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { SWAGGER_TAG_SESSION_PLAYERS } from 'src/swagger.config';
import { UserSimpleDisplayData } from 'src/users/dto';
import { JoinSessionDto } from '../dto/input/create-session-player.dto';
import {
  JoinSessionResponseData,
  JoinSessionResponseDto,
} from '../dto/output/join-session-response.dto';
import { PlayerSuggestionResponseDto } from '../dto/output/player-suggestion-response.dto';
import { SessionsPipe } from '../pipes/sessions.pipe';
import { SessionPlayersService } from '../services/session-players.service';
import { SessionsService } from '../services/sessions.service';

@ApiTags(SWAGGER_TAG_SESSION_PLAYERS)
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
  @ApiCreatedResponse({ type: JoinSessionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async joinSession(
    @Req() request: FastifyRequest,
    @Body() joinSessionDto: JoinSessionDto,
  ): Promise<ResponseTypeDto<JoinSessionResponseData>> {
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
  ): Promise<PaginationResponseTypeDto<UserSimpleDisplayData>> {
    const userUid = request['user'].uid;
    const data = await this.playersService.suggestPlayerFromPreviousSessions(userUid);
    return {
      data,
      message: 'Players suggested successfully',
    };
  }

  @Patch(':sessionUid/:teamUid/switch-team')
  @Protected()
  @ApiOperation({ summary: 'Allows a user to switch to another team in a session' })
  @ApiNoContentResponse({ description: 'Player switched to another team successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiParam({ name: 'sessionUid', type: String })
  @ApiParam({ name: 'teamUid', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  async switchTeams(
    @Param('sessionUid', SessionsPipe) session: Sessions,
    @Req() request: FastifyRequest,
    @Param('teamUid') teamUid: string,
  ): Promise<void> {
    const userUid = request['user'].uid;
    await this.playersService.switchPlayerToAnotherTeam(session, userUid, teamUid);
  }

  @Delete(':sessionUid/leave')
  @Protected()
  @ApiOperation({ summary: 'Allows a user to leave a session' })
  @ApiNoContentResponse({ description: 'Player left session successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiParam({ name: 'sessionUid', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveSession(
    @Param('sessionUid', SessionsPipe) session: Sessions,
    @Req() request: FastifyRequest,
  ): Promise<void> {
    const userUid = request['user'].uid;
    await this.playersService.leaveSession(session, userUid);
  }
}
