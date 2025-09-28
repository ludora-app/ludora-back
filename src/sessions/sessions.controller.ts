import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Sessions } from '@prisma/client';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import { ResponseType, ResponseTypeDto } from 'src/interfaces/response-type';

import { CreateSessionDto } from './dto/input/create-session.dto';
import { SessionFilterDto } from './dto/input/session-filter.dto';
import { UpdateSessionDto } from './dto/input/update-session.dto';
import {
  PaginatedSessionTeamResponse,
  SessionTeamResponse,
} from './dto/output/session-team.response';
import { PaginatedSessionResponse, SessionResponse } from './dto/output/session.response';
import { SessionTeamsService } from './session-teams.service';
import { SessionsService } from './sessions.service';
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly sessionTeamsService: SessionTeamsService,
  ) {}

  // ************************
  // ******* SESSIONS *******
  // ************************

  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiOkResponse({ type: ResponseTypeDto<Sessions> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  async create(@Body() createSessionDto: CreateSessionDto): Promise<ResponseType<SessionResponse>> {
    const newSession = await this.sessionsService.create(createSessionDto);

    return {
      data: newSession,
      message: 'Session created successfully',
      status: 201,
    };
  }

  @Get('/all')
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiOkResponse({ type: PaginatedSessionResponse })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  async findAll(
    @Query() filter: SessionFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionResponse>> {
    const sessions = await this.sessionsService.findAll(filter);

    return {
      data: sessions,
      message: 'Sessions fetched successfully',
      status: 200,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by id' })
  @ApiOkResponse({ type: ResponseTypeDto<Sessions> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async findOne(@Param('id') id: string): Promise<ResponseType<SessionResponse>> {
    const session = await this.sessionsService.findOne(id);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      data: session,
      message: 'Session fetched successfully',
      status: 200,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a session by id' })
  @ApiOkResponse({ type: ResponseTypeDto<Sessions> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<ResponseType<SessionResponse>> {
    const updatedSession = await this.sessionsService.update(id, updateSessionDto);

    return {
      data: updatedSession,
      message: 'Session updated successfully',
      status: 200,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.sessionsService.remove(+id);
  }
  // ************************
  // ********* TEAMS ********
  // ************************
  @Get(':uid/teams')
  @ApiOperation({ summary: 'Get all teams linked to a session by session uid' })
  @ApiOkResponse({ type: PaginatedSessionTeamResponse })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async findTeamsBySessionId(
    @Param('uid') uid: string,
  ): Promise<PaginationResponseTypeDto<SessionTeamResponse>> {
    const existingSession = await this.sessionsService.findOne(uid);

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    const teams = await this.sessionTeamsService.findTeamsBySessionUid(uid);

    if (teams.items.length === 0) {
      throw new NotFoundException('No teams found for session');
    }

    return {
      data: teams,
      message: `Teams fetched successfully for session ${uid}`,
      status: 200,
    };
  }

  @Get('/teams/:uid')
  @ApiOperation({ summary: 'Get a team by its uid' })
  @ApiOkResponse({ type: ResponseTypeDto<SessionTeamResponse> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async findOneTeamByUid(@Param('uid') uid: string): Promise<ResponseType<SessionTeamResponse>> {
    const team = await this.sessionTeamsService.findOneByUid(uid);

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
