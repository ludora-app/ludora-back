import { ResponseTypeDto } from 'src/interfaces/response-type';
import { SessionsService } from 'src/sessions/sessions.service';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Controller,
  forwardRef,
  Get,
  Inject,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common';

import { SessionTeamsService } from './session-teams.service';
import {
  PaginatedSessionTeamResponse,
  SessionTeamResponse,
} from './dto/output/session-team.response';

@Controller('session-teams')
export class SessionTeamsController {
  constructor(
    @Inject(forwardRef(() => SessionsService)) private readonly sessionsService: SessionsService,
    private readonly teamsService: SessionTeamsService,
  ) {}

  @Get(':sessionUid/teams')
  @ApiOperation({ summary: 'Get all teams linked to a session by session uid' })
  @ApiOkResponse({ type: PaginatedSessionTeamResponse })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async findTeamsBySessionUid(
    @Param('sessionUid') sessionUid: string,
  ): Promise<PaginationResponseTypeDto<SessionTeamResponse>> {
    const existingSession = await this.sessionsService.findOne(sessionUid);

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    const teams = await this.teamsService.findTeamsBySessionUid(sessionUid);

    if (teams.items.length === 0) {
      throw new NotFoundException('No teams found for session');
    }

    return {
      data: teams,
      message: `Teams fetched successfully for session ${sessionUid}`,
      status: 200,
    };
  }

  @Get('/teams/:uid')
  @ApiOperation({ summary: 'Get a team by its uid' })
  @ApiOkResponse({ type: ResponseTypeDto<SessionTeamResponse> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async findOneTeamByUid(@Param('uid') uid: string): Promise<ResponseTypeDto<SessionTeamResponse>> {
    const team = await this.teamsService.findOneByUid(uid);

    if (!team) {
      throw new NotFoundException(`Team with uid ${uid} not found`);
    }

    return {
      data: team,
      message: 'Team fetched successfully',
      status: 200,
    };
  }
}
