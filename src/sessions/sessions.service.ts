import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationType, Sessions } from 'generated/prisma/client';
import { SessionTeamsService } from 'src/session-teams/session-teams.service';
import { ConversationsService } from 'src/conversations/conversations.service';
import { ImageResponseDto } from 'src/shared/images/dto/output/image-response.dto';
import { SessionPlayersService } from 'src/session-players/session-players.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { StorageFolderName, Sport, SessionScope } from 'src/shared/constants/constants';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';

import { DateUtils } from './../shared/utils/date.utils';
import { SessionFilterDto } from './dto/input/session-filter.dto';
import { UpdateSessionDto } from './dto/input/update-session.dto';
import { RawSession, SessionMapper } from './mappers/session.mapper';
import { CreateSessionWithUserDto } from './dto/input/create-session.dto';
import { SessionCollectionItem } from './dto/output/session-collection.response';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionTeamsService: SessionTeamsService,
    private readonly sessionPlayersService: SessionPlayersService,
    private readonly storageService: StorageService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async create(createSessionDto: CreateSessionWithUserDto): Promise<Sessions> {
    const { endDate, fieldUid, startDate, userUid } = createSessionDto;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayOfWeek = start.getUTCDay(); // 0 (sunday) to 6 (saturday)

    const field = await this.prisma.fields.findUnique({
      where: { uid: fieldUid },
    });

    if (!field) {
      throw new BadRequestException('Field not found');
    }

    const openingHours = await this.prisma.partnerOpeningHours.findUnique({
      where: {
        partnerUid_dayOfWeek: {
          dayOfWeek: dayOfWeek,
          partnerUid: field.partnerUid,
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
        fieldUid: fieldUid,
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

    const newSession = await this.prisma.$transaction(async (tx) => {
      const createdSession = await tx.sessions.create({
        data: {
          creatorUid: userUid,
          description: createSessionDto.description,
          endDate: endDate,
          fieldUid: field.uid,
          gameMode: field.gameMode,
          maxPlayersPerTeam: createSessionDto.maxPlayersPerTeam,
          minPlayersPerTeam: createSessionDto.minPlayersPerTeam,
          sport: field.sport as Sport,
          startDate: startDate,
          teamsPerGame: createSessionDto.teamsPerGame,
          title: createSessionDto.title ? createSessionDto.title : autoTitle,
        },
      });
      // create default teams in transaction and fetch them back
      const defaultTeams = await this.sessionTeamsService.createDefaultTeams(
        createdSession.uid,
        tx,
      );
      // pick team A for the creator
      const teamA = defaultTeams.find((t) => t.teamLabel === 'A');
      if (teamA && createSessionDto.userUid) {
        await this.sessionPlayersService.addPlayerToSession(
          {
            sessionUid: createdSession.uid,
            teamUid: teamA.uid,
            userUid: createSessionDto.userUid,
          },
          tx,
        );
      }
      // create conversation inside transaction to ensure data consistency
      await this.conversationsService.createSessionConversation(
        {
          name: createdSession.title,
          sessionUid: createdSession.uid,
          type: ConversationType.SESSION,
          userUids: [createSessionDto.userUid],
        },
        tx,
      );
      return createdSession;
    });

    return newSession;
  }

  /**
   * Find sessions with geographic filtering using PostGIS
   *
   * This method uses raw SQL queries to leverage PostGIS functions for efficient
   * geographic distance calculations. The query uses ST_DWithin for filtering
   * and ST_Distance for calculating exact distances.
   *
   * @param filter - Session filter parameters including geographic coordinates
   * @returns Paginated list of sessions with field information
   *
   * @see {@link POSTGIS_IMPLEMENTATION.md} for detailed documentation
   */
  async findAll(filter: SessionFilterDto): Promise<PaginatedDataDto<SessionCollectionItem>> {
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

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Store user coordinates indices for SELECT clause
    let userLongitudeParamIndex: number | null = null;
    let userLatitudeParamIndex: number | null = null;

    // Date filters
    const now = new Date();
    if (scope === SessionScope.PAST) {
      conditions.push(`s.start_date < $${paramIndex}`);
      params.push(now);
      paramIndex++;
    } else if (scope === SessionScope.UPCOMING || !scope) {
      conditions.push(`s.start_date >= $${paramIndex}`);
      params.push(now);
      paramIndex++;
    }

    if (minStart) {
      conditions.push(`s.start_date >= $${paramIndex}`);
      params.push(minStart);
      paramIndex++;
    }

    if (maxStart) {
      conditions.push(`s.start_date <= $${paramIndex}`);
      params.push(maxStart);
      paramIndex++;
    }

    // Sport filter
    if (sports?.length) {
      conditions.push(`s.sport = ANY($${paramIndex})`);
      params.push(sports);
      paramIndex++;
    }

    // Distance filter with PostGIS
    if (latitude !== undefined && longitude !== undefined && maxDistance !== undefined) {
      // ST_DWithin uses meters, so convert km to meters
      const maxDistanceMeters = maxDistance * 1000;
      userLongitudeParamIndex = paramIndex;
      userLatitudeParamIndex = paramIndex + 1;
      conditions.push(
        `ST_DWithin(
          ST_MakePoint(f.longitude, f.latitude)::geography,
          ST_MakePoint($${paramIndex}, $${paramIndex + 1})::geography,
          $${paramIndex + 2}
        )`,
      );
      params.push(longitude, latitude, maxDistanceMeters);
      paramIndex += 3;
    }

    // Cursor-based pagination
    if (cursor) {
      conditions.push(`s.uid > $${paramIndex}`);
      params.push(cursor);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build distance calculation for SELECT if coordinates provided
    const distanceSelect =
      userLongitudeParamIndex !== null && userLatitudeParamIndex !== null
        ? `, ST_Distance(
            ST_MakePoint(f.longitude, f.latitude)::geography, 
            ST_MakePoint($${userLongitudeParamIndex}, $${userLatitudeParamIndex})::geography
          ) as distance`
        : '';

    const query = `
      SELECT 
        s.uid,
        s.creator_uid as "creatorUid",
        s.start_date as "startDate",
        s.end_date as "endDate",
        s.sport,
        s.game_mode as "gameMode",
        s.max_players_per_team as "maxPlayersPerTeam",
        f.short_address as "fieldShortAddress",
        f.latitude as "fieldLatitude",
        f.longitude as "fieldLongitude",
        (
          SELECT json_agg(
            json_build_object(
              'teamName', st.team_name,
              'numberOfPlayers', (
                SELECT COUNT(*)::int 
                FROM sessions."Session_players" sp 
                WHERE sp.team_uid = st.uid
              )
            )
          )
          FROM sessions."Session_teams" st
          WHERE st.session_uid = s.uid
        ) as "sessionTeams",
        (
          SELECT fi.url
          FROM infrastructure."Field_images" fi
          WHERE fi.field_uid = f.uid
          ORDER BY fi."order" ASC
          LIMIT 1
        ) as "fieldImage"
        ${distanceSelect}
      FROM sessions."Sessions" s
      INNER JOIN infrastructure."Fields" f ON s.field_uid = f.uid
      ${whereClause}
      ORDER BY s.start_date ASC
      LIMIT $${paramIndex}
    `;

    params.push(limit + 1);

    // Execute raw query
    const sessions = await this.prisma.$queryRawUnsafe<Array<RawSession>>(query, ...params);

    // Handle pagination
    let nextCursor: string | null = null;
    if (sessions.length > limit) {
      const nextItem = sessions.pop();
      nextCursor = nextItem!.uid;
    }

    const items = SessionMapper.fromRawToSessionResponses(sessions);

    // Calculate distance between user and session field
    items.forEach((item) => {
      if (latitude !== undefined && longitude !== undefined) {
        item.distance = GeolocalisationService.calculateDistanceBetweenCoordinates(
          latitude,
          longitude,
          item.fieldLatitude,
          item.fieldLongitude,
        );
      }
    });

    return {
      items,
      nextCursor,
      totalCount: items.length,
    };
  }

  async findOne(uid: string): Promise<Sessions> {
    return await this.prisma.sessions.findUnique({ where: { uid } });
  }

  async update(uid: string, updateSessionDto: UpdateSessionDto): Promise<Sessions> {
    const { endDate, startDate } = updateSessionDto;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayOfWeek = start.getUTCDay(); // 0 (sunday) to 6 (saturday)

    const session = await this.findOne(uid);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // todo: use the field service when created
    const field = await this.prisma.fields.findUnique({
      where: { uid: session.fieldUid },
    });
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    const openingHours = await this.prisma.partnerOpeningHours.findUnique({
      where: {
        partnerUid_dayOfWeek: {
          dayOfWeek: dayOfWeek,
          partnerUid: field.partnerUid,
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
      where: { uid: session.uid },
    });

    return {
      ...updatedSession,
      sport: updatedSession.sport as Sport,
    };
  }

  remove(uid: string) {
    return `This action removes a #${uid} session`;
  }

  async getImagesBySessionUid(sessionUid: string): Promise<ImageResponseDto[]> {
    const images = await this.prisma.sessionImages.findMany({
      orderBy: { createdAt: 'asc' },
      where: { sessionUid },
    });

    if (!images || images.length === 0) {
      return [];
    }
    const response = await Promise.all(
      images.map(async (image) => {
        const url = await this.storageService.getSignedUrl(StorageFolderName.SESSIONS, image.url);
        return { order: image.order, url };
      }),
    );

    return response;
  }

  async getFirstImageBySessionUid(sessionUid: string): Promise<ImageResponseDto | null> {
    const image = await this.prisma.sessionImages.findFirst({
      where: {
        OR: [{ order: 1 }, { order: null }, { order: undefined }],
        sessionUid,
      },
    });

    if (!image) {
      return null;
    }

    const url = await this.storageService.getSignedUrl(StorageFolderName.SESSIONS, image.url);

    return { order: image.order, url };
  }

  /**
   * This TypeScript function retrieves the count of sessions created within the last 24 hours using
   * Prisma.
   * @returns The `getCreatedSessionsCount` method returns a Promise that resolves to a number
   * representing the count of sessions created within the last 24 hours from the current time.
   * @description This method is used in the metrics service to get the count of sessions created within the last 24 hours.
   */
  async getCreatedSessionsCount(): Promise<number> {
    return await this.prisma.sessions.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
  }
}
