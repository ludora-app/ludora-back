import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseType } from 'src/interfaces/response-type';
import { DtoMapperUtil } from 'src/shared/utils/dto-mapper.util';
import { formatDate, timeStringToMinutes } from 'src/shared/utils/date.utils';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';

import { SessionResponse } from './dto/output/session-response';
import { SessionFilterDto } from './dto/input/session-filter.dto';
import { CreateSessionDto } from './dto/input/create-session.dto';
import { UpdateSessionDto } from './dto/input/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSessionDto: CreateSessionDto): Promise<ResponseType<SessionResponse>> {
    const { endDate, fieldId, startDate } = createSessionDto;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayOfWeek = start.getUTCDay(); // 0 (sunday) to 6 (saturday)

    const field = await this.prisma.fields.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new BadRequestException('Field not found');
    }

    const openingHours = await this.prisma.partner_opening_hours.findUnique({
      where: {
        partner_id_day_of_week: {
          day_of_week: dayOfWeek,
          partner_id: field.partner_id,
        },
      },
    });

    if (!openingHours || openingHours.is_closed) {
      throw new BadRequestException('The field is closed on this date');
    }

    // ? convert start and end to minutes
    const sessionStartMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
    const sessionEndMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
    const openMinutes = timeStringToMinutes(openingHours.open_time);
    const closeMinutes = timeStringToMinutes(openingHours.close_time);

    if (sessionStartMinutes < openMinutes || sessionEndMinutes > closeMinutes) {
      throw new BadRequestException('The session is outside the opening hours of the field');
    }

    // ? check if the session is in the past
    if (start < new Date()) {
      throw new BadRequestException('The session is in the past');
    }

    // ? check if the end date is after the start date
    if (end < start) {
      throw new BadRequestException('The end date must be after the start date');
    }

    // ? check if there is no session at this time
    const conflict = await this.prisma.sessions.findFirst({
      where: {
        end_date: { gt: start },
        field_id: fieldId,
        start_date: { lt: end },
      },
    });

    if (conflict) {
      throw new BadRequestException(
        'Another session is already scheduled at this time on this field',
      );
    }

    let autoTitle = '';

    if (!createSessionDto.title) {
      autoTitle = `Session de ${field.sport} le ${formatDate(startDate)}`;
    }

    const newSession = await this.prisma.sessions.create({
      data: {
        description: createSessionDto.description,
        end_date: endDate,
        field_id: field.id,
        game_mode: field.game_mode,
        max_players_per_team: createSessionDto.maxPlayersPerTeam,
        min_players_per_team: createSessionDto.minPlayersPerTeam,
        sport: field.sport,
        start_date: startDate,
        teams_per_game: createSessionDto.teamsPerGame,
        title: createSessionDto.title ? createSessionDto.title : autoTitle,
      },
    });

    const mappedSession = DtoMapperUtil.toCamelCase(SessionResponse, newSession) as SessionResponse;

    return {
      data: mappedSession,
      message: 'Session created successfully',
      status: 201,
    };
  }

  async findAll(filter: SessionFilterDto): Promise<PaginationResponseTypeDto<SessionResponse>> {
    const {
      cursor,
      latitude,
      limit = 10,
      longitude,
      maxDistance,
      maxStart,
      minStart,
      scope,
      sports,
    } = filter;

    const query: {
      take: number;
      skip?: number;
      cursor?: {
        id: string;
      };
      where: {
        start_date?: Record<string, Date>;
        sport?: { in: string[] } | string;
        distance?: {
          from: { latitude: number; longitude: number };
          to: { latitude: number; longitude: number };
        };
      };
    } = {
      take: limit + 1,
      where: {},
    };

    if (cursor) {
      query.cursor = {
        id: cursor,
      };
      query.skip = 1;
    }

    const now = new Date();

    if (scope === 'PAST') {
      query.where.start_date = { lt: now };
    } else if (scope === 'UPCOMING') {
      query.where.start_date = { gte: now };
    }

    if (minStart) {
      query.where.start_date = {
        ...(query.where.start_date || {}),
        gte: minStart,
      };
    }
    if (maxStart) {
      query.where.start_date = {
        ...(query.where.start_date || {}),
        lte: maxStart,
      };
    }

    if (sports?.length) {
      query.where.sport = { in: sports };
    }

    if (latitude && longitude && maxDistance) {
      query.where.distance = {
        from: { latitude, longitude },
        to: { latitude, longitude },
      };
    }

    const sessions = await this.prisma.sessions.findMany({
      ...query,
      select: {
        created_at: true,
        description: true,
        end_date: true,
        id: true,
        max_players_per_team: true,
        min_players_per_team: true,
        sport: true,
        start_date: true,
        teams_per_game: true,
        title: true,
        updated_at: true,
      },
    });

    let nextCursor: string | null = null;
    if (sessions.length > limit) {
      const nextItem = sessions.pop();
      nextCursor = nextItem!.id;
    }

    if (sessions.length < 0) {
      throw new BadRequestException('No sessions found with the given parameters');
    }

    const mappedSessions = DtoMapperUtil.toCamelCase(
      SessionResponse,
      sessions,
    ) as SessionResponse[];

    return {
      data: { items: mappedSessions, nextCursor, totalCount: sessions.length },
      message: 'Sessions fetched successfully',
      status: 200,
    };
  }

  async findOne(id: string): Promise<ResponseType<any>> {
    const session = await this.prisma.sessions.findUnique({ where: { id } });

    if (!session) {
      throw new NotFoundException('Session not found');
    }
    const mappedSession = DtoMapperUtil.toCamelCase(SessionResponse, session);

    return {
      data: mappedSession,
      message: 'Session fetched successfully',
      status: 200,
    };
  }

  async update(
    id: string,
    updateSessionDto: UpdateSessionDto,
  ): Promise<ResponseType<SessionResponse>> {
    const { endDate, startDate } = updateSessionDto;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayOfWeek = start.getUTCDay(); // 0 (sunday) to 6 (saturday)

    const session = await this.prisma.sessions.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const field = await this.prisma.fields.findUnique({
      where: { id: session.field_id },
    });
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    const openingHours = await this.prisma.partner_opening_hours.findUnique({
      where: {
        partner_id_day_of_week: {
          day_of_week: dayOfWeek,
          partner_id: field.partner_id,
        },
      },
    });
    if (!openingHours || openingHours.is_closed) {
      throw new BadRequestException('The field is closed on this date');
    }

    const sessionStartMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
    const sessionEndMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
    const openMinutes = timeStringToMinutes(openingHours.open_time);
    const closeMinutes = timeStringToMinutes(openingHours.close_time);

    if (sessionStartMinutes < openMinutes || sessionEndMinutes > closeMinutes) {
      throw new BadRequestException('The session is outside the opening hours of the field');
    }

    const updatedSession = await this.prisma.sessions.update({
      data: {
        description: updateSessionDto.description,
        end_date: endDate,
        game_mode: updateSessionDto.gameMode,
        max_players_per_team: updateSessionDto.maxPlayersPerTeam,
        min_players_per_team: updateSessionDto.minPlayersPerTeam,
        sport: field.sport,
        start_date: startDate,
        teams_per_game: updateSessionDto.teamsPerGame,
        title: updateSessionDto.title,
      },
      where: { id: session.id },
    });

    const mappedSession = DtoMapperUtil.toCamelCase(
      SessionResponse,
      updatedSession,
    ) as SessionResponse;

    return {
      data: mappedSession,
      message: 'Session updated successfully',
      status: 200,
    };
  }

  remove(id: number) {
    return `This action removes a #${id} session`;
  }
}
