import { Controller, Get, NotFoundException, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { NotFoundResponseDto } from 'src/shared/dto/errors/not-found-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { PaginationResponseTypeDto } from 'src/shared/dto/responses/pagination-response-type';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';
import {
  PaginatedSessionTeamResponseDto,
  SessionTeamResponseData,
  SessionTeamResponseDto,
} from '../dto/output/session-team-response';
import { SessionTeamsService } from '../services/session-teams.service';
import { SessionsService } from '../services/sessions.service';

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
    @Req() request: FastifyRequest,
  ): Promise<PaginationResponseTypeDto<SessionTeamResponseData>> {
    const userUid = request['user'].uid;
    const teams = await this.sessionsService.findTeamsBySessionUid(sessionUid, userUid);

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
  @ApiOkResponse({ type: SessionTeamResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  async findOneTeamByUid(
    @Param('uid') uid: string,
  ): Promise<ResponseTypeDto<SessionTeamResponseData>> {
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
