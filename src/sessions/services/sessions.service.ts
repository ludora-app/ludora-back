import { PinoLogger } from 'nestjs-pino';
import { Prisma } from 'generated/prisma/client';
import { DateUtils } from 'src/shared/utils/date.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationType, Sessions } from 'generated/prisma/client';
import { SessionPlayers, SessionTeams } from 'generated/prisma/browser';
import { ConversationsService } from 'src/conversations/conversations.service';
import { ImageResponseDto } from 'src/shared/images/dto/output/image-response.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { SessionScope, Sport, StorageFolderName } from 'src/shared/constants/constants';
import { UserHourPreferencesService } from 'src/user-hour-preferences/user-hour-preferences.service';
import { UserSportPreferencesService } from 'src/user-sport-preferences/user-sport-preferences.service';

import { SessionMapper } from '../mappers/session.mapper';
import { SessionTeamsService } from './session-teams.service';
import { UpdateSessionDto } from '../dto/input/update-session.dto';
import { CreateSessionDto } from '../dto/input/create-session.dto';
import { FindAllSessionsDto } from '../dto/input/session-filter.dto';
import { SESSION_SUGGESTION_CONFIG } from '../constants/session.constants';
import { CreateSessionPlayerDto } from '../dto/input/create-session-player.dto';
import { SessionCollectionItemDto } from '../dto/output/session-collection.response.dto';
import { MySessionFilterDto, SessionOwnnership } from '../dto/input/my-session-filter.dto';

/**
 * This service is responsible for the creation, retrieval, and management of sessions.
 * In order to avoid circular dependencies, it is also the orchestrator for other session-related services.
 */

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsService: SessionTeamsService,
    private readonly playersService: SessionPlayersService,
    private readonly storageService: StorageService,
    private readonly conversationsService: ConversationsService,
    private readonly userHourPreferencesService: UserHourPreferencesService,
    private readonly userSportPreferencesService: UserSportPreferencesService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SessionsService.name);
  }

  async create(createSessionDto: CreateSessionDto): Promise<Sessions> {
    const { endDate, fieldUid, level, startDate, userUid } = createSessionDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const field = await this.prisma.fields.findUnique({
      where: { uid: fieldUid },
    });

    if (!field) {
      throw new BadRequestException('Field not found');
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
          gameMode: createSessionDto.gameMode,
          level,
          maxPlayersPerTeam: createSessionDto.maxPlayersPerTeam,
          minPlayersPerTeam: createSessionDto.minPlayersPerTeam,
          sport: field.sport as Sport,
          startDate: startDate,
          teamsPerGame: createSessionDto.teamsPerGame,
          title: createSessionDto.title ? createSessionDto.title : autoTitle,
        },
      });
      // create default teams in transaction and fetch them back
      const defaultTeams = await this.teamsService.createDefaultTeams(createdSession.uid, tx);
      // pick team A for the creator
      const teamA = defaultTeams.find((t) => t.teamLabel === 'A');
      if (teamA && createSessionDto.userUid) {
        await this.playersService.addPlayerToSession(
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
   * Find all sessions suggestions with filtering and scoring
   * This method filters sessions based on sports, date range, and location,
   * then scores them based on user preferences and proximity
   *
   * @param params - Filtering and pagination parameters
   * @returns Paginated list of session suggestions with scores
   */
  async findAll({
    cursor,
    endDate,
    level,
    limit = 10,
    maxDistance = SESSION_SUGGESTION_CONFIG.THRESHOLDS.MAX_DISTANCE_METERS,
    sports: filterSports = [],
    startDate,
    urgent = false,
    userLat,
    userLon,
    userUid,
  }: FindAllSessionsDto): Promise<PaginatedDataDto<SessionCollectionItemDto>> {
    const userSportPreferencesResponse =
      await this.userSportPreferencesService.findAllByUserUid(userUid);
    const userSportPreferences = userSportPreferencesResponse.items || [];

    const userTimePreferencesResponse =
      await this.userHourPreferencesService.findAllByUserUid(userUid);
    const userTimePreferences = userTimePreferencesResponse.items || [];

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

    // C. LEVEL
    let levelWhereSql = Prisma.empty;
    if (level) {
      levelWhereSql = Prisma.sql`AND s.level = ${level}`;
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
        const { max, min } = DateUtils.getHoursForPeriod(pref.timePeriod);
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
          ${levelWhereSql}
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
        level: true,
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

    const items = SessionMapper.fromRawToSessionResponses(sortedSessions, rawDataMap);

    return {
      items,
      nextCursor,
      totalCount,
    };
  }

  async findAllByUserUid(
    userUid: string,
    filters: MySessionFilterDto,
  ): Promise<PaginatedDataDto<SessionCollectionItemDto>> {
    const {
      createdAtSortOrder,
      endDate,
      level,
      maxStart,
      minStart,
      ownership,
      scope,
      sports,
      startDateSortOrder,
    } = filters;

    const where: Prisma.SessionsWhereInput = {};

    if (ownership === SessionOwnnership.CREATOR) {
      where.creatorUid = userUid;
    } else if (ownership === SessionOwnnership.PLAYER) {
      where.sessionPlayers = {
        some: {
          userUid: userUid,
        },
      };
    } else {
      // If no ownership specified, get both creator and player sessions
      where.OR = [{ creatorUid: userUid }, { sessionPlayers: { some: { userUid: userUid } } }];
    }

    // Handle date filters
    const startDateFilter: Prisma.DateTimeFilter = {};
    const endDateFilter: Prisma.DateTimeFilter = {};

    if (minStart) {
      startDateFilter.gte = minStart;
    }
    if (maxStart) {
      startDateFilter.lte = maxStart;
    }
    if (endDate) {
      endDateFilter.lte = endDate;
    }

    if (scope) {
      if (scope === SessionScope.UPCOMING) {
        startDateFilter.gte = new Date();
      } else if (scope === SessionScope.PAST) {
        startDateFilter.lt = new Date();
      }
    }

    if (Object.keys(startDateFilter).length > 0) {
      where.startDate = startDateFilter;
    }
    if (Object.keys(endDateFilter).length > 0) {
      where.endDate = endDateFilter;
    }

    // Handle sports filter
    if (sports && sports.length > 0) {
      where.sport = { in: sports };
    }

    // Handle level filter
    if (level) {
      where.level = level;
    }

    // Build orderBy
    const orderBy: Prisma.SessionsOrderByWithRelationInput[] = [];
    if (startDateSortOrder) {
      orderBy.push({ startDate: startDateSortOrder });
    }
    if (createdAtSortOrder) {
      orderBy.push({ createdAt: createdAtSortOrder });
    }

    const sessions = await this.prisma.sessions.findMany({
      orderBy: orderBy.length > 0 ? orderBy : undefined,
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
        level: true,
        maxPlayersPerTeam: true,
        sessionTeams: { select: { _count: { select: { sessionPlayers: true } }, teamName: true } },
        sport: true,
        startDate: true,
        uid: true,
      },
      where,
    });

    const items = SessionMapper.fromRawToSessionResponses(sessions, new Map());

    return {
      items,
      nextCursor: null,
      totalCount: items.length,
    };
  }

  async findOne(uid: string): Promise<Sessions> {
    return await this.prisma.sessions.findUnique({ where: { uid } });
  }

  async update(uid: string, updateSessionDto: UpdateSessionDto): Promise<Sessions> {
    const { endDate, startDate } = updateSessionDto;

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

  // ============================================================================
  //                                 SESSION TEAMS
  // ============================================================================

  async findTeamsBySessionUid(sessionUid: string): Promise<PaginatedDataDto<SessionTeams>> {
    const existingSession = await this.findOne(sessionUid);

    if (!existingSession) {
      this.logger.error(`Session ${sessionUid} not found`);
      throw new NotFoundException(`Session ${sessionUid} not found`);
    }

    return await this.teamsService.findTeamsBySessionUid(sessionUid);
  }

  // ============================================================================
  //                                 SESSION PLAYERS
  // ============================================================================

  /**
   * This method is used to add a player to a session when a user joins a session.
   * @param createSessionPlayerDto
   */
  async joinSession(createSessionPlayerDto: CreateSessionPlayerDto): Promise<SessionPlayers> {
    const existingSession = await this.findOne(createSessionPlayerDto.sessionUid);

    if (!existingSession) {
      this.logger.error(`Session ${createSessionPlayerDto.sessionUid} not found`);
      throw new NotFoundException(`Session ${createSessionPlayerDto.sessionUid} not found`);
    }
    const existingTeam = await this.teamsService.findOneByUid(createSessionPlayerDto.teamUid);

    if (!existingTeam) {
      this.logger.error(`Team ${createSessionPlayerDto.teamUid} not found`);
      throw new NotFoundException(`Team ${createSessionPlayerDto.teamUid} not found`);
    }

    if (existingSession.uid !== existingTeam.sessionUid) {
      this.logger.error(
        `Session ${createSessionPlayerDto.sessionUid} and team ${createSessionPlayerDto.teamUid} do not match`,
      );
      throw new BadRequestException(
        `Session ${createSessionPlayerDto.sessionUid} and team ${createSessionPlayerDto.teamUid} do not match`,
      );
    }

    if (existingTeam._count.sessionPlayers >= existingSession.maxPlayersPerTeam) {
      this.logger.error(`Team ${createSessionPlayerDto.teamUid} is full`);
      throw new BadRequestException(`Team ${createSessionPlayerDto.teamUid} is full`);
    }

    const existingPlayer = await this.playersService.findOne(
      createSessionPlayerDto.sessionUid,
      createSessionPlayerDto.userUid,
    );

    if (existingPlayer) {
      this.logger.error(
        `Player ${createSessionPlayerDto.userUid} already in session ${createSessionPlayerDto.sessionUid}`,
      );
      throw new BadRequestException(
        `Player ${createSessionPlayerDto.userUid} already in session ${createSessionPlayerDto.sessionUid}`,
      );
    }

    return this.playersService.addPlayerToSession(createSessionPlayerDto);
  }
}
