import { FastifyRequest } from 'fastify';
import { Throttle } from '@nestjs/throttler';
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
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SessionMapper } from '../mappers/session.mapper';
import { SessionsService } from '../services/sessions.service';
import { UpdateSessionDto } from '../dto/input/update-session.dto';
import { SessionFilterDto } from '../dto/input/session-filter.dto';
import { MySessionFilterDto } from '../dto/input/my-session-filter.dto';
import { CreateSessionFromRequestDto } from '../dto/input/create-session.dto';
import { SessionResponseData, SessionResponseDto } from '../dto/output/session-response.dto';
import {
  PaginatedSessionCollectionResponseDto,
  SessionCollectionItemDto,
} from '../dto/output/session-collection-response.dto';
import {
  FindOneSessionResponseData,
  FindOneSessionResponseDto,
  FindOneSessionWithDistanceResponseData,
  FindOneSessionWithDistanceResponseDto,
} from '../dto/output/find-one-session-response.dto';

@Controller('sessions')
@UseGuards(AuthB2CGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Protected()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new session' })
  @ApiCreatedResponse({ type: SessionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSessionDto: CreateSessionFromRequestDto,
    @Req() request: Request,
  ): Promise<ResponseTypeDto<SessionResponseData>> {
    const userUid = request['user'].uid;
    const newSession = await this.sessionsService.create({ ...createSessionDto, userUid });

    return {
      data: SessionMapper.toDto(newSession),
      message: 'Session created successfully',
    };
  }

  @Get('/list/collection')
  @Protected()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiOkResponse({ type: PaginatedSessionCollectionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() request: Request,
    @Query() filter: SessionFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionCollectionItemDto>> {
    const userUid = request['user'].uid;

    const sessions = await this.sessionsService.findAll({
      userUid,
      ...filter,
    });
    return {
      data: {
        items: sessions.items,
        nextCursor: sessions.nextCursor,
        totalCount: sessions.totalCount,
      },
      message: 'Sessions fetched successfully',
    };
  }

  @Get('my-list/collection')
  @Protected()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all sessions created or joined by the current user' })
  @ApiOkResponse({ type: PaginatedSessionCollectionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAllByUserUid(
    @Req() request: Request,
    @Query() filters: MySessionFilterDto,
  ): Promise<PaginationResponseTypeDto<SessionCollectionItemDto>> {
    const userUid = request['user'].uid;
    const sessions = await this.sessionsService.findAllByUserUid(userUid, filters);
    return {
      data: sessions,
      message: 'Sessions fetched successfully',
    };
  }

  @Get(':uid')
  @Protected()
  @ApiOperation({ summary: 'Get a session by uid' })
  @ApiOkResponse({ type: FindOneSessionResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  async findOne(
    @Param('uid') uid: string,
    @Req() request: FastifyRequest,
  ): Promise<ResponseTypeDto<FindOneSessionResponseData>> {
    const userUid = request['user'].uid;
    const session = await this.sessionsService.findOne(uid, userUid);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      data: session,
      message: 'Session fetched successfully',
    };
  }

  @Get(':uid/distance')
  @Protected()
  @ApiOperation({
    summary: 'Get a session by uid with the connected users distance to the session',
  })
  @ApiOkResponse({ type: FindOneSessionWithDistanceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  async findOneWithDistance(
    @Param('uid') uid: string,
    @Req() request: FastifyRequest,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ): Promise<ResponseTypeDto<FindOneSessionWithDistanceResponseData>> {
    const userUid = request['user'].uid;
    const session = await this.sessionsService.findOneWithDistance(
      uid,
      userUid,
      latitude,
      longitude,
    );

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      data: session,
      message: 'Session fetched successfully',
    };
  }

  @Patch(':uid')
  @Protected()
  @ApiOperation({ summary: 'Update a session by uid' })
  @ApiNoContentResponse({ description: 'Session updated successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @ApiNotFoundResponse({ type: NotFoundResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('uid') uid: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<void> {
    await this.sessionsService.update(uid, updateSessionDto);

    return;
  }

  @Delete(':uid')
  @Protected()
  async remove(@Param('uid') uid: string) {
    return this.sessionsService.remove(uid);
  }
}
