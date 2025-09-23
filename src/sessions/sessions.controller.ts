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
import { PaginatedSessionResponse, SessionResponse } from './dto/output/session-response';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

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
}
