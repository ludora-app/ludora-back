import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SessionsService } from '../services/sessions.service';
import { SessionTeamsService } from '../services/session-teams.service';
import {
  PaginatedSessionTeamResponseDto,
  SessionTeamResponseDto,
} from '../dto/output/session-team.response';

@Controller('session-teams')
@UseGuards(AuthB2CGuard)
export class SessionTeamsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly teamsService: SessionTeamsService,
  ) {}

  @Get('list-by-session/:sessionUid')
  @Protected()
  @ApiOperation({ summary: 'Get all teams linked to a session by session uid' })
  @ApiOkResponse({ type: PaginatedSessionTeamResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  async findTeamsBySessionUid(
    @Param('sessionUid') sessionUid: string,
  ): Promise<PaginationResponseTypeDto<SessionTeamResponseDto>> {
    const teams = await this.sessionsService.findTeamsBySessionUid(sessionUid);

    if (teams.items.length === 0) {
      throw new NotFoundException('No teams found for session');
    }

    return {
      data: teams,
      message: `Teams fetched successfully for session ${sessionUid}`,
    };
  }

  @Get('/teams/:uid')
  @Protected()
  @ApiOperation({ summary: 'Get a team by its uid' })
  @ApiOkResponse({ type: ResponseTypeDto<SessionTeamResponseDto> })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  async findOneTeamByUid(
    @Param('uid') uid: string,
  ): Promise<ResponseTypeDto<SessionTeamResponseDto>> {
    const team = await this.teamsService.findOneByUid(uid);

    if (!team) {
      throw new NotFoundException(`Team with uid ${uid} not found`);
    }

    return {
      data: team,
      message: 'Team fetched successfully',
    };
  }
}
