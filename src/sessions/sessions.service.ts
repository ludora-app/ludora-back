import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationResponseTypeDto } from 'src/interfaces/pagination-response-type';

import { SessionFilterDto } from './dto/input/session-filter.dto';
import { FindAllSessionsData } from './dto/output/find-all-sessions.res';

// import { CreateSessionDto } from './dto/input/create-session.dto';
// import { UpdateSessionDto } from './dto/input/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}
  // create(createSessionDto: CreateSessionDto) {
  //   return 'This action adds a new session';
  // }

  async findAll(filter: SessionFilterDto): Promise<PaginationResponseTypeDto<FindAllSessionsData>> {
    const {
      cursor,
      latitude,
      limit = 10,
      longitude,
      maxDistance,
      maxStart,
      minStart,
      scope,
      sport,
    } = filter;

    const query: {
      take: number;
      skip?: number;
      cursor?: {
        id: string;
      };
      where: {
        start_date?: Record<string, Date>;
        sport?: string;
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

    if (sport) {
      query.where.sport = sport;
    }

    if (latitude && longitude && maxDistance) {
      query.where.distance = {
        from: { latitude, longitude },
        to: { latitude, longitude },
      };
    }

    const sessions = (await this.prisma.sessions.findMany({
      ...query,
      select: {
        created_at: true,
        description: true,
        end_date: true,
        id: true,
        max_players_per_team: true,
        max_teams_per_game: true,
        min_players_per_team: true,
        min_teams_per_game: true,
        sport: true,
        start_date: true,
        title: true,
        updated_at: true,
      },
    })) as FindAllSessionsData[];

    let nextCursor: string | null = null;
    if (sessions.length > limit) {
      const nextItem = sessions.pop();
      nextCursor = nextItem!.id;
    }

    return {
      data: { items: sessions, nextCursor, totalCount: sessions.length },
      message: 'Sessions fetched successfully',
      status: 200,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} session`;
  }

  // update(id: number, updateSessionDto: UpdateSessionDto) {
  //   return `This action updates a #${id} session`;
  // }

  remove(id: number) {
    return `This action removes a #${id} session`;
  }
}
