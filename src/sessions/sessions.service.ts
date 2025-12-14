import { Prisma } from 'generated/prisma/client';
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
import { SESSION_SUGGESTION_CONFIG, SessionUtils } from './utils/session-utils';
import { SessionCollectionItem } from './dto/output/session-collection.response';
import { findAllSessionsSuggestionsDto } from './dto/input/session-suggestion-filter.dto';
import { SessionCollectionSuggestionItem } from './dto/output/session-collection-suggestion.response';

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

  /**
   * Find all sessions suggestions with filtering and scoring
   * This method filters sessions based on sports, date range, and location,
   * then scores them based on user preferences and proximity
   *
   * @param params - Filtering and pagination parameters
   * @returns Paginated list of session suggestions with scores
   */
  async findAllSessionsSuggestions({
    cursor,
    endDate,
    filterSports = [],
    limit = 10,
    maxDistance = SESSION_SUGGESTION_CONFIG.THRESHOLDS.MAX_DISTANCE_METERS,
    startDate,
    urgent = false,
    userLat,
    userLon,
    userSportPreferences = [],
    userTimePreferences = [],
  }: findAllSessionsSuggestionsDto): Promise<PaginatedDataDto<SessionCollectionSuggestionItem>> {
    // ---------------------------------------------------------
    // 0. INITIALIZATION CONFIG
    // ---------------------------------------------------------
    const { SCORES, THRESHOLDS } = SESSION_SUGGESTION_CONFIG;
    const currentOffset = cursor ? parseInt(cursor, 10) : 0;
    const take = limit + 1;

    // ---------------------------------------------------------
    // 1. SPORTS HANDLING (CORE LOGIC)
    // ---------------------------------------------------------

    const isFiltering = filterSports.length > 0;

    // Which sports should we score?
    // If filtering, we score the filters. Otherwise, we score the user's profile.
    const sportsToScore = isFiltering ? filterSports : userSportPreferences.map((s) => s.sport);

    const hasSportsToScore = sportsToScore.length > 0;

    // A. SCORING (+1000 pts) - Match user's sport preferences or filter sports
    const sportScoreSql = hasSportsToScore
      ? Prisma.sql`CASE WHEN s.sport::text IN (${Prisma.join(sportsToScore)}) THEN ${SCORES.SPORT_MATCH} ELSE 0 END`
      : Prisma.sql`0`;

    // B. STRICT FILTERING (Only if active filter) - Apply sports filter if provided
    let sportWhereSql = Prisma.empty;
    if (isFiltering) {
      sportWhereSql = Prisma.sql`AND s.sport::text IN (${Prisma.join(filterSports)})`;
    }

    // ---------------------------------------------------------
    // 2. DATE HANDLING (Bulletproof JS)
    // ---------------------------------------------------------
    const now = new Date();
    const startDateObj = startDate ? new Date(startDate) : null;
    let endDateObj = null;

    // Midnight Correction: Push end of day to 23:59:59
    if (endDate) {
      endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
    }

    let discoveryLimit: Date | null = null;
    if (startDateObj) {
      discoveryLimit = new Date(startDateObj);
      discoveryLimit.setDate(discoveryLimit.getDate() + 2);
    }

    // ---------------------------------------------------------
    // 3. SAFETY BARRIER
    // ---------------------------------------------------------
    const hasLocation = userLat != null && userLon != null;
    const hasTimePrefs = userTimePreferences.length > 0;
    const hasDate = !!startDateObj;
    // We consider we have criteria if we have sports (profile or filter)
    const hasSportsCriteria = hasSportsToScore;

    if (!hasLocation && !hasSportsCriteria && !hasTimePrefs && !urgent && !hasDate) {
      return { items: [], nextCursor: null, totalCount: 0 };
    }

    // ---------------------------------------------------------
    // 4. REMAINING SQL CONSTRUCTION
    // ---------------------------------------------------------

    // C. DISTANCE
    let distanceScoreSql = Prisma.sql`0`;
    let distanceValueSql = Prisma.sql`NULL`; // <--- NEW: Raw value by default
    let distanceWhereSql = Prisma.empty;
    if (hasLocation) {
      // 1. Define the formula once
      distanceValueSql = Prisma.sql`
        public.ST_DistanceSphere(
          public.ST_MakePoint(f.longitude::float, f.latitude::float), 
          public.ST_MakePoint(${userLon}::float, ${userLat}::float)
        )
      `;

      // 2. Reuse the variable in the Score (Cleaner!)
      distanceScoreSql = Prisma.sql`
        (CASE 
            WHEN (${distanceValueSql}) < ${maxDistance}
            THEN ${SCORES.DISTANCE_MAX_POINTS} * (1 - ((${distanceValueSql}) / ${maxDistance}))
            ELSE 0 
        END)
      `;

      // 3. Reuse the variable in the Where
      distanceWhereSql = Prisma.sql`
        AND (${distanceValueSql}) < ${maxDistance}
      `;
    }

    // D. TIME PREFS
    let timeScoreSql = Prisma.sql`0`;
    if (hasTimePrefs) {
      const timeConditions = userTimePreferences.map((pref) => {
        const { max, min } = SessionUtils.getHoursForPeriod(pref.timePeriod);
        const hourCondition = Prisma.sql`EXTRACT(HOUR FROM s.start_date) >= ${min} AND EXTRACT(HOUR FROM s.start_date) < ${max}`;
        if (pref.type === 'RECURRENT')
          return Prisma.sql`(EXTRACT(DOW FROM s.start_date) = ${pref.dayOfWeek} AND ${hourCondition})`;
        else return Prisma.sql`(DATE(s.start_date) = DATE(${pref.date}) AND ${hourCondition})`;
      });
      if (timeConditions.length > 0) {
        timeScoreSql = Prisma.sql`CASE WHEN ${Prisma.join(timeConditions, ' OR ')} THEN ${SCORES.TIME_PREFERENCE} ELSE 0 END`;
      }
    }

    // E. DATE LOGIC
    let dateWhereSql = Prisma.empty;
    let dateScoreSql = Prisma.sql`0`;

    if (startDateObj && endDateObj) {
      // STRICT RANGE
      dateWhereSql = Prisma.sql`AND s.start_date >= ${startDateObj} AND s.start_date <= ${endDateObj}`;
      dateScoreSql = Prisma.sql`${SCORES.DATE_RANGE_MATCH}`;
    } else if (startDateObj && discoveryLimit) {
      // DISCOVERY
      dateWhereSql = Prisma.sql`AND s.start_date >= ${startDateObj}`;
      dateScoreSql = Prisma.sql`
            CASE 
              WHEN DATE(s.start_date) = DATE(${startDateObj}) THEN ${SCORES.DATE_TARGET_EXACT}
              WHEN s.start_date >= ${startDateObj} AND s.start_date <= ${discoveryLimit} THEN ${SCORES.DATE_TARGET_ADJACENT}
              ELSE 0 
            END
        `;
    } else {
      // DEFAULT
      dateWhereSql = Prisma.sql`AND s.start_date > NOW()`;
      if (urgent) {
        const urgentHighLimit = new Date(now.getTime() + THRESHOLDS.URGENCY_HIGH_MS);
        const urgentMediumLimit = new Date(now.getTime() + THRESHOLDS.URGENCY_MEDIUM_MS);
        dateScoreSql = Prisma.sql`
                CASE 
                  WHEN s.start_date BETWEEN ${now} AND ${urgentHighLimit} THEN ${SCORES.URGENCY_HIGH}
                  WHEN s.start_date BETWEEN ${now} AND ${urgentMediumLimit} THEN ${SCORES.URGENCY_MEDIUM}
                  ELSE 0 
                END
             `;
      } else {
        const defaultLimit = new Date(now.getTime() + THRESHOLDS.DEFAULT_WINDOW_MS);
        dateScoreSql = Prisma.sql`CASE WHEN s.start_date < ${defaultLimit} THEN ${SCORES.URGENCY_DEFAULT} ELSE 0 END`;
      }
    }

    // ---------------------------------------------------------
    // 5. EXECUTION
    // ---------------------------------------------------------

    const rankedSessions = await this.prisma.$queryRaw<
      {
        uid: string;
        score: number;
        start_date: Date;
        total_count: bigint;
        distance_val: number | null;
      }[]
    >`
      SELECT 
        ranked_sessions.*,
        count(*) OVER() as total_count 
      FROM (
        SELECT 
          s.uid,
          s.start_date,
          (${distanceValueSql}) as distance_val,
          (
            (${sportScoreSql}) +
            (${distanceScoreSql}) +
            (${timeScoreSql}) +
            (${dateScoreSql})
          ) as score
        
        FROM sessions."Sessions" s
        JOIN infrastructure."Fields" f ON s.field_uid = f.uid 
        
        WHERE 
          1=1 
          ${distanceWhereSql}
          ${dateWhereSql}
          ${sportWhereSql} -- HERE: Strict filter only if filterSports is filled
      ) as ranked_sessions
      
      WHERE 1=1
      
      ORDER BY 
        ranked_sessions.score DESC,
        ranked_sessions.start_date ASC
      
      LIMIT ${take} 
      OFFSET ${currentOffset};
    `;

    // ---------------------------------------------------------
    // 6. HYDRATION & RETURN (Standard Code)
    // ---------------------------------------------------------

    if (!rankedSessions || rankedSessions.length === 0) {
      return { items: [], nextCursor: null, totalCount: 0 };
    }

    const totalCount = Number(rankedSessions[0].total_count);
    let nextCursor: string | null = null;
    let itemsToFetch = rankedSessions;

    if (rankedSessions.length > limit) {
      itemsToFetch.pop();
      nextCursor = (currentOffset + limit).toString();
    }

    const sessionUids = itemsToFetch.map((r) => r.uid);
    const sessions = await this.prisma.sessions.findMany({
      select: {
        creatorUid: true,
        endDate: true,
        field: {
          select: {
            fieldImages: { select: { url: true }, take: 1 },
            latitude: true,
            longitude: true,
            shortAddress: true,
          },
        },
        gameMode: true,
        maxPlayersPerTeam: true,
        sessionTeams: { select: { _count: { select: { sessionPlayers: true } }, teamName: true } },
        sport: true,
        startDate: true,
        uid: true,
      },
      where: { uid: { in: sessionUids } },
    });

    const rawDataMap = new Map(
      itemsToFetch.map((item, index) => [item.uid, { distance: item.distance_val, index }]),
    );
    const sortedSessions = sessions.sort((a, b) => {
      const indexA = rawDataMap.get(a.uid)?.index ?? 999;
      const indexB = rawDataMap.get(b.uid)?.index ?? 999;
      return indexA - indexB;
    });

    const items = SessionMapper.toSessionCollectionSuggestionItems(sortedSessions, rawDataMap);

    return {
      items,
      nextCursor,
      totalCount,
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
