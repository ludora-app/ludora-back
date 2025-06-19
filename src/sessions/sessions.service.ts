import { Sessions } from '@prisma/client';
import { Sport } from 'src/shared/constants/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DateUtils } from './../shared/utils/date.utils';
import { SessionFilterDto } from './dto/input/session-filter.dto';
import { CreateSessionDto } from './dto/input/create-session.dto';
import { UpdateSessionDto } from './dto/input/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSessionDto: CreateSessionDto): Promise<Sessions> {
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
        partnerId_dayOfWeek: {
          dayOfWeek: dayOfWeek,
          partnerId: field.partnerId,
        },
      },
    });

    if (!openingHours || openingHours.isClosed) {
      throw new BadRequestException('The field is closed on this date');
    }

    // ? convert start and end to minutes
    const sessionStartMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
    const sessionEndMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
    const openMinutes = DateUtils.timeStringToMinutes(openingHours.openTime);
    const closeMinutes = DateUtils.timeStringToMinutes(openingHours.closeTime);

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
        endDate: { gt: start },
        fieldId: fieldId,
        startDate: { lt: end },
      },
    });

    if (conflict) {
      throw new BadRequestException(
        'Another session is already scheduled at this time on this field',
      );
    }

    let autoTitle = '';

    if (!createSessionDto.title) {
      autoTitle = `Session de ${field.sport} le ${DateUtils.formatDate(startDate)}`;
    }

    const newSession = await this.prisma.sessions.create({
      data: {
        description: createSessionDto.description,
        endDate: endDate,
        fieldId: field.id,
        gameMode: field.gameMode,
        maxPlayersPerTeam: createSessionDto.maxPlayersPerTeam,
        minPlayersPerTeam: createSessionDto.minPlayersPerTeam,
        sport: field.sport as Sport,
        startDate: startDate,
        teamsPerGame: createSessionDto.teamsPerGame,
        title: createSessionDto.title ? createSessionDto.title : autoTitle,
      },
    });

    return newSession;
  }

  async findAll(filter: SessionFilterDto): Promise<{
    items: Sessions[];
    nextCursor: string | null;
    totalCount: number;
  }> {
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
        startDate?: Record<string, Date>;
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
      query.where.startDate = { lt: now };
    } else if (scope === 'UPCOMING') {
      query.where.startDate = { gte: now };
    }

    if (minStart) {
      query.where.startDate = {
        ...(query.where.startDate || {}),
        gte: minStart,
      };
    }
    if (maxStart) {
      query.where.startDate = {
        ...(query.where.startDate || {}),
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
        createdAt: true,
        description: true,
        endDate: true,
        fieldId: true,
        gameMode: true,
        id: true,
        maxPlayersPerTeam: true,
        minPlayersPerTeam: true,
        sport: true,
        startDate: true,
        teamsPerGame: true,
        title: true,
        updatedAt: true,
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

    return {
      items: sessions,
      nextCursor,
      totalCount: sessions.length,
    };
  }

  async findOne(id: string): Promise<Sessions> {
    const session = await this.prisma.sessions.findUnique({ where: { id } });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async update(id: string, updateSessionDto: UpdateSessionDto): Promise<Sessions> {
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
      where: { id: session.fieldId },
    });
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    const openingHours = await this.prisma.partner_opening_hours.findUnique({
      where: {
        partnerId_dayOfWeek: {
          dayOfWeek: dayOfWeek,
          partnerId: field.partnerId,
        },
      },
    });
    if (!openingHours || openingHours.isClosed) {
      throw new BadRequestException('The field is closed on this date');
    }

    const sessionStartMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
    const sessionEndMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
    const openMinutes = DateUtils.timeStringToMinutes(openingHours.openTime);
    const closeMinutes = DateUtils.timeStringToMinutes(openingHours.closeTime);

    if (sessionStartMinutes < openMinutes || sessionEndMinutes > closeMinutes) {
      throw new BadRequestException('The session is outside the opening hours of the field');
    }

    const updatedSession = await this.prisma.sessions.update({
      data: {
        description: updateSessionDto.description,
        endDate: endDate,
        gameMode: updateSessionDto.gameMode,
        maxPlayersPerTeam: updateSessionDto.maxPlayersPerTeam,
        minPlayersPerTeam: updateSessionDto.minPlayersPerTeam,
        sport: field.sport,
        startDate: startDate,
        teamsPerGame: updateSessionDto.teamsPerGame,
        title: updateSessionDto.title,
      },
      where: { id: session.id },
    });

    return updatedSession;
  }

  remove(id: number) {
    return `This action removes a #${id} session`;
  }
}
