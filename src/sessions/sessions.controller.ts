import { Sessions } from '@prisma/client';
import { AuthB2CGuard } from 'src/auth-b2c/guards/auth-b2c.guard';
import { ResponseType, ResponseTypeDto } from 'src/interfaces/response-type';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/input/create-session.dto';
import { SessionFilterDto } from './dto/input/session-filter.dto';
import { UpdateSessionDto } from './dto/input/update-session.dto';
import { PaginatedSessionResponse, SessionResponse } from './dto/output/session.response';

@Controller('sessions')
@UseGuards(AuthB2CGuard)
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

  @Get(':uid')
  @ApiOperation({ summary: 'Get a session by uid' })
  @ApiOkResponse({ type: ResponseTypeDto<Sessions> })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  async findOne(@Param('uid') uid: string): Promise<ResponseType<SessionResponse>> {
    const session = await this.sessionsService.findOne(uid);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      data: session,
      message: 'Session fetched successfully',
      status: 200,
    };
  }

  @Patch(':uid')
  @ApiOperation({ summary: 'Update a session by uid' })
  @ApiNoContentResponse({ description: 'Session updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestException })
  @ApiUnauthorizedResponse({ type: UnauthorizedException })
  @ApiNotFoundResponse({ type: NotFoundException })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('uid') uid: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<void> {
    await this.sessionsService.update(uid, updateSessionDto);

    return;
  }

  @Delete(':uid')
  async remove(@Param('uid') uid: string) {
    return this.sessionsService.remove(uid);
  }
}
