import { PinoLogger } from 'nestjs-pino';
import { Prisma } from 'generated/prisma/client';
import { DateUtils } from 'src/shared/utils/date.utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionScope } from 'src/shared/constants/constants';
import { FieldsService } from 'src/fields/services/fields.service';
import { StorageService } from 'src/shared/storage/storage.service';
import { ConversationType, Sessions } from 'generated/prisma/client';
import { FieldSlotsService } from 'src/fields/services/field-slots.service';
import { ImageResponseDto } from 'src/shared/images/dto/output/image-response.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { SessionPlayersService } from 'src/sessions/services/session-players.service';
import { ConversationsService } from 'src/conversations/services/conversations.service';
import { GeolocalisationService } from 'src/shared/geolocalisation/geolocalisation.service';
import { HourPreferencesService } from 'src/user-preferences/services/hour-preferences.service';
import { SportPreferencesService } from 'src/user-preferences/services/sport-preferences.service';
import {
  FieldSlots,
  FieldType,
  GameModes,
  SessionPlayers,
  SessionVisibility,
} from 'generated/prisma/browser';

import { SessionTeamsService } from './session-teams.service';
import { UpdateSessionDto } from '../dto/input/update-session.dto';
import { CreateSessionDto } from '../dto/input/create-session.dto';
import { FindAllSessionsDto } from '../dto/input/session-filter.dto';
import { SESSION_SUGGESTION_CONFIG } from '../constants/session.constants';
import { SessionTeamResponseData } from '../dto/output/session-team-response';
import { CreateSessionPlayerDto } from '../dto/input/create-session-player.dto';
import { RawSessionFindOneItem, SessionMapper } from '../mappers/session.mapper';
import { SessionCollectionItemDto } from '../dto/output/session-collection-response.dto';
import { MySessionFilterDto, SessionOwnnership } from '../dto/input/my-session-filter.dto';
import {
  FindOneSessionResponseData,
  FindOneSessionWithDistanceResponseData,
} from '../dto/output/find-one-session-response.dto';

/**
 * This service is responsible for the creation, retrieval, and management of sessions.
 * In order to avoid circular dependencies, it is also the orchestrator for other session-related services.
 */

@Injectable()
export class SessionsService {
  async getUserSessionStats(
    userUid: string,
  ): Promise<{ organizedCount: number; participatedCount: number }> {
    const [organizedCount, participatedCount] = await Promise.all([
      this.prisma.sessions.count({
        where: { creatorUid: userUid },
      }),
      this.prisma.sessions.count({
        where: {
          sessionPlayers: {
            some: {
              userUid: userUid,
            },
          },
        },
      }),
    ]);

    return { organizedCount, participatedCount };
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsService: SessionTeamsService,
    private readonly playersService: SessionPlayersService,
    private readonly storageService: StorageService,
    private readonly conversationsService: ConversationsService,
    private readonly hourPreferencesService: HourPreferencesService,
    private readonly sportPreferencesService: SportPreferencesService,
    private readonly fieldSlotsService: FieldSlotsService,
    private readonly fieldsService: FieldsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SessionsService.name);
  }

  async create(createSessionDto: CreateSessionDto): Promise<Sessions> {
    const {
      endDate,
      fieldUid,
      level,
      slotUid,
      sport,
      startDate,
      teamAName,
      teamBName,
      userUid,
      visibility,
    } = createSessionDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const field = await this.fieldsService.findOne(fieldUid);

    if (!field) {
      this.logger.error(`Field not found: ${fieldUid}`);
      throw new NotFoundException('Field not found');
    }

    if (!field.sports.includes(sport)) {
      this.logger.error(`Sport not found: ${sport} on field: ${fieldUid}`);
      throw new BadRequestException('This sport is not available on this field');
    }

    if (field.type === FieldType.PRIVATE && !slotUid) {
      throw new BadRequestException('Private fields require a field slot');
    }

    DateUtils.checkValidityForCreation(startDate, endDate);

    let existingSlot: FieldSlots | null = null;
    //* PRIVATE FIELD VERIFICATIONS
    if (field.type === FieldType.PRIVATE) {
      existingSlot = await this.fieldSlotsService.findOne(slotUid);
      if (!existingSlot) {
        throw new BadRequestException('Field slot not found');
      }

      if (existingSlot.isReserved) {
        throw new BadRequestException('The slot is already reserved');
      }
      if (
        !(
          existingSlot.startTime.getTime() === start.getTime() &&
          existingSlot.endTime.getTime() === end.getTime()
        )
      ) {
        throw new BadRequestException('The slot is not available at this time');
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
        this.logger.error(
          `Another session is already scheduled at this time on this field: ${conflict.uid}`,
        );
        throw new BadRequestException(
          'Another session is already scheduled at this time on this field',
        );
      }
    }

    let autoTitle = '';

    if (!createSessionDto.title) {
      // autoTitle = `Session de ${field.sport} le ${DateUtils.formatDate(startDate)}`;
    }
    const { maxPlayersPerTeam, minPlayersPerTeam, teamsPerGame } = this.getPlayersPerTeamData(
      createSessionDto.gameMode,
    );

    const teamANameToUse = teamAName ?? 'Equipe A';
    const teamBNameToUse = teamBName ?? 'Equipe B';

    const newSession = await this.prisma.$transaction(async (tx) => {
      const createdSession = await tx.sessions.create({
        data: {
          creatorUid: userUid,
          description: createSessionDto.description,
          endDate: endDate,
          fieldUid: field.uid,
          gameMode: createSessionDto.gameMode,
          level,
          maxPlayersPerTeam,
          minPlayersPerTeam,
          slotUid: existingSlot?.uid,
          sport,
          startDate: startDate,
          teamsPerGame,
          title: createSessionDto.title ? createSessionDto.title : autoTitle,
          visibility,
        },
      });

      // create default teams in transaction and fetch them back
      const defaultTeams = await this.teamsService.createDefaultTeams(
        createdSession.uid,
        teamANameToUse,
        teamBNameToUse,
        tx,
      );
      // pick team A for the creator
      const teamA = defaultTeams.find((t) => t.teamName === teamANameToUse);
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
          userUid: createSessionDto.userUid,
        },
        tx,
      );
      return createdSession;
    });

    if (field.type === FieldType.PRIVATE) {
      await this.fieldSlotsService.markAsReserved(existingSlot.uid);
    }

    return newSession;
  }

  /**
   * Find all sessions suggestions with filtering and scoring
   * This method filters sessions based on sports, date range, and location,
   * then scores them based on user preferences and proximity
   *
   * @param params - Filtering and pagination parameters
   * @returns Paginated list of PUBLIC sessions suggestions with scores
   */
  async findAll({
    cursor,
    duration,
    endDate,
    gameModes: filterGameModes = [],
    levels: filterLevels = [],
    limit = 10,
    maxDistance = SESSION_SUGGESTION_CONFIG.THRESHOLDS.MAX_DISTANCE_METERS,
    search,
    sports: filterSports = [],
    startDate,
    urgent = false,
    userLat,
    userLon,
    userUid,
  }: FindAllSessionsDto): Promise<PaginatedDataDto<SessionCollectionItemDto>> {
    const userSportPreferencesResponse =
      await this.sportPreferencesService.findAllByUserUid(userUid);
    const userSportPreferences = userSportPreferencesResponse.items || [];

    const userTimePreferencesResponse = await this.hourPreferencesService.findAllByUserUid(userUid);
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
    // B.A. LEVELS (Nombres)
    let levelWhereSql = Prisma.empty;
    if (filterLevels.length > 0) {
      levelWhereSql = Prisma.sql`AND s.level IN (${Prisma.join(filterLevels.map((l) => Prisma.sql`${l}`))})`;
    }

    // B.B. GAME MODES (Strings)
    let gameModeWhereSql = Prisma.empty;
    if (filterGameModes.length > 0) {
      gameModeWhereSql = Prisma.sql`AND s.game_mode::text IN (${Prisma.join(filterGameModes)})`;
    }

    // B.C. DURATION (Strings)
    let durationWhereSql = Prisma.empty;
    if (duration) {
      // 1. (s.end_date - s.start_date) donne un intervalle
      // 2. EXTRACT(EPOCH FROM ...) convertit cet intervalle en SECONDES totales
      // 3. On divise par 60 pour avoir les minutes
      // 4. On cast en ::int pour comparer proprement avec ton paramètre
      durationWhereSql = Prisma.sql`
        AND (EXTRACT(EPOCH FROM (s.end_date - s.start_date)) / 60)::int = ${duration}
      `;
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
    // 3. SEARCH INTELLIGENCE
    // ---------------------------------------------------------
    let searchScoreSql = Prisma.sql`0`;
    let searchWhereSql = Prisma.empty;

    if (search) {
      // Nettoyage pour comparaison stricte (ex: "Five V Five" -> "FiveVFive")
      const searchCompact = search.replace(/\s+/g, '');
      const searchPattern = `%${search}%`;
      const searchCompactPattern = `%${searchCompact}%`;

      // SCORE : On prend le meilleur score entre le Titre Session et le Nom du Terrain
      searchScoreSql = Prisma.sql`
        GREATEST(
          word_similarity(${search}, s.title), 
          word_similarity(${search}, f.name),
          similarity(REPLACE(s.title, ' ', ''), ${searchCompact}),
          similarity(REPLACE(f.name, ' ', ''), ${searchCompact})
        ) * ${SCORES.SEARCH_MAX_POINTS}
      `;

      // FILTRE : On garde si ça match le titre OU le terrain
      searchWhereSql = Prisma.sql`
        AND (
          s.title %> ${search}                      -- Session Title fuzzy
          OR f.name %> ${search}                    -- Field Name fuzzy
          OR s.title ILIKE ${searchPattern}         -- Session Title exact
          OR f.name ILIKE ${searchPattern}          -- Field Name exact
          OR REPLACE(s.title, ' ', '') ILIKE ${searchCompactPattern} -- Compact match
          OR REPLACE(f.name, ' ', '') ILIKE ${searchCompactPattern}  -- Compact match
        )
      `;
    }
    // ---------------------------------------------------------
    // 4. SAFETY BARRIER
    // ---------------------------------------------------------
    const hasLocation = userLat != null && userLon != null;
    const hasTimePrefs = userTimePreferences.length > 0;
    const hasDate = !!startDateObj;
    // We consider we have criteria if we have sports (profile or filter)
    const hasSportsCriteria = hasSportsToScore;
    const hasSearch = !!search;
    const hasDuration = !!duration;
    if (
      !hasLocation &&
      !hasSportsCriteria &&
      !hasTimePrefs &&
      !urgent &&
      !hasDate &&
      !hasSearch &&
      !hasDuration
    ) {
      return { items: [], nextCursor: null, totalCount: 0 };
    }

    // ---------------------------------------------------------
    // 5. REMAINING SQL CONSTRUCTION
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
    // 6. EXECUTION
    // ---------------------------------------------------------
    await this.prisma.$executeRawUnsafe(
      `SET pg_trgm.word_similarity_threshold = ${THRESHOLDS.WORD_SIMILARITY_THRESHOLD};`,
    );
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
            (${dateScoreSql}) +
            (${searchScoreSql})
          ) as score
        
        FROM sessions."Sessions" s
        JOIN infrastructure."Fields" f ON s.field_uid = f.uid 
        
        WHERE 
          1=1 
          ${distanceWhereSql}
          ${dateWhereSql}
          ${sportWhereSql} -- HERE: Strict filter only if filterSports is filled
          ${levelWhereSql}
          ${gameModeWhereSql}
          ${searchWhereSql}
          ${durationWhereSql}
          AND s.visibility = ${SessionVisibility.PUBLIC}
      ) as ranked_sessions
      
      WHERE 1=1
      
      ORDER BY 
        ranked_sessions.score DESC,
        ranked_sessions.start_date ASC,
        ranked_sessions.uid ASC -- HERE: Ensure consistent pagination to avoid duplicates
      
      LIMIT ${take} 
      OFFSET ${currentOffset};
    `;

    // ---------------------------------------------------------
    // 7. HYDRATION & RETURN (Standard Code)
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
        visibility: true,
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
      cursor,
      endDate,
      level,
      limit = 10,
      maxStart,
      minStart,
      ownership,
      scope,
      sports,
      startDateSortOrder,
      visibility,
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

    // Handle visibility filter
    if (visibility) {
      where.visibility = visibility;
    }

    const take = limit + 1;
    // Build orderBy
    const orderBy: Prisma.SessionsOrderByWithRelationInput[] = [];
    if (startDateSortOrder) {
      orderBy.push({ startDate: startDateSortOrder });
    }
    if (createdAtSortOrder) {
      orderBy.push({ createdAt: createdAtSortOrder });
    }

    // Add uid to orderBy to ensure stable pagination
    orderBy.push({ uid: 'asc' });

    const [sessions, totalCount] = await Promise.all([
      this.prisma.sessions.findMany({
        cursor: cursor ? { uid: cursor } : undefined,
        orderBy,
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
          sessionTeams: {
            select: { _count: { select: { sessionPlayers: true } }, teamName: true },
          },
          sport: true,
          startDate: true,
          uid: true,
          visibility: true,
        },
        skip: cursor ? 1 : 0,
        take,
        where,
      }),
      this.prisma.sessions.count({ where }),
    ]);

    let nextCursor: string | null = null;
    if (sessions.length > limit) {
      const nextItem = sessions.pop();
      nextCursor = nextItem!.uid;
    }

    const items = SessionMapper.fromRawToSessionResponses(sessions, new Map());

    return {
      items,
      nextCursor,
      totalCount,
    };
  }

  async findOne(uid: string, userUid?: string | undefined): Promise<FindOneSessionResponseData> {
    const [session, creatorSessionsCount] = await Promise.all([
      this.prisma.sessions.findUnique({
        select: {
          creator: {
            select: {
              firstname: true,
              imageUrl: true,
              lastname: true,
            },
          },
          creatorUid: true,
          description: true,
          endDate: true,
          field: {
            select: {
              fieldImages: { select: { order: true, url: true } },
              latitude: true,
              longitude: true,
              shortAddress: true,
              type: true,
              uid: true,
            },
          },
          gameMode: true,
          level: true,
          maxPlayersPerTeam: true,
          sessionTeams: {
            select: {
              sessionPlayers: {
                select: {
                  teamUid: true,
                  user: { select: { firstname: true, imageUrl: true, lastname: true } },
                  userUid: true,
                },
              },
              teamLabel: true,
              teamName: true,
              uid: true,
            },
          },
          sport: true,
          startDate: true,
          title: true,
          uid: true,
          viewCount: true,
          visibility: true,
        },
        where: { uid },
      }) as Promise<Omit<RawSessionFindOneItem, 'isJoined'>>,
      // Parallel query for creator sessions count - will be resolved together
      this.prisma.sessions
        .findUnique({
          select: { creatorUid: true },
          where: { uid },
        })
        .then((s) =>
          s
            ? this.prisma.sessions.count({
                where: { creatorUid: s.creatorUid },
              })
            : 0,
        ),
    ]);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.incrementViewCount(uid);

    const isJoined = session.sessionTeams.some((team) =>
      team.sessionPlayers.some((player) => player.userUid === userUid),
    );

    const teamsWithIsJoined = await Promise.all(
      session.sessionTeams.map(async (team) => {
        const totalPlayersInTeam = team.sessionPlayers.length;

        const currentPlayerIndex = team.sessionPlayers.findIndex(
          (player) => player.userUid === userUid,
        );

        let playersToProcess = team.sessionPlayers;
        if (currentPlayerIndex !== -1) {
          const otherPlayers = team.sessionPlayers
            .filter((_, index) => index !== currentPlayerIndex)
            .slice(0, 2);
          playersToProcess = [team.sessionPlayers[currentPlayerIndex], ...otherPlayers];
        } else {
          playersToProcess = team.sessionPlayers.slice(0, 3);
        }

        return {
          ...team,
          isJoined: currentPlayerIndex !== -1,
          sessionPlayers: playersToProcess,
          totalPlayersInTeam,
        };
      }),
    );

    const totalPlayersInSession = teamsWithIsJoined.reduce(
      (sum, team) => sum + team.totalPlayersInTeam,
      0,
    );

    const totalAvailableSpots = session.maxPlayersPerTeam * session.sessionTeams.length;

    const remainingPlayers = Math.max(0, totalAvailableSpots - totalPlayersInSession);

    return SessionMapper.toFindOneDto({
      ...session,
      creatorSessionsCount,
      isJoined: isJoined,
      remainingPlayers,
      sessionTeams: teamsWithIsJoined,
    });
  }

  /**
   *  Same as the findOne method, but with the connected users distance to the session
   * @param uid
   * @param latitude
   * @param longitude
   * @returns
   */
  async findOneWithDistance(
    uid: string,
    userUid: string,
    latitude: number,
    longitude: number,
  ): Promise<FindOneSessionWithDistanceResponseData> {
    const session = await this.findOne(uid, userUid);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    const distance = GeolocalisationService.calculateDistanceBetweenCoordinates(
      latitude,
      longitude,
      session.fieldLatitude,
      session.fieldLongitude,
    );
    return { ...session, userDistance: distance };
  }

  async update(uid: string, updateSessionDto: UpdateSessionDto): Promise<void> {
    const { endDate, startDate } = updateSessionDto;

    const session = await this.findOne(uid);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // todo: use the field service when created
    const field = await this.fieldsService.findOne(session.fieldUid);
    if (!field) {
      throw new NotFoundException('Field not found');
    }

    await this.prisma.sessions.update({
      data: {
        description: updateSessionDto.description,
        endDate,
        gameMode: updateSessionDto.gameMode,
        maxPlayersPerTeam: updateSessionDto.maxPlayersPerTeam,
        minPlayersPerTeam: updateSessionDto.minPlayersPerTeam,
        startDate: startDate,
        teamsPerGame: updateSessionDto.teamsPerGame,
        title: updateSessionDto.title,
      },
      where: { uid: session.uid },
    });

    return;
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

    return images.map((image) => ({ order: image.order, url: image.url }));
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

    return image;
  }

  /**
   * Calculates the players per team data based on the game mode
   * @param mode - The game mode
   * @returns The players per team data
   */
  getPlayersPerTeamData(
    mode: GameModes,
  ): Required<Pick<Sessions, 'maxPlayersPerTeam' | 'minPlayersPerTeam' | 'teamsPerGame'>> {
    switch (mode) {
      case GameModes.ONE_V_ONE:
        return { maxPlayersPerTeam: 1, minPlayersPerTeam: 1, teamsPerGame: 1 };
      case GameModes.TWO_V_TWO:
        return { maxPlayersPerTeam: 2, minPlayersPerTeam: 2, teamsPerGame: 1 };
      case GameModes.THREE_V_THREE:
        return { maxPlayersPerTeam: 3, minPlayersPerTeam: 3, teamsPerGame: 1 };
      case GameModes.FOUR_V_FOUR:
        return { maxPlayersPerTeam: 4, minPlayersPerTeam: 3, teamsPerGame: 1 };
      case GameModes.FIVE_V_FIVE:
        return { maxPlayersPerTeam: 5, minPlayersPerTeam: 3, teamsPerGame: 1 };
      case GameModes.SIX_V_SIX:
        return { maxPlayersPerTeam: 6, minPlayersPerTeam: 4, teamsPerGame: 1 };
      case GameModes.SEVEN_V_SEVEN:
        return { maxPlayersPerTeam: 7, minPlayersPerTeam: 5, teamsPerGame: 1 };
      case GameModes.EIGHT_V_EIGHT:
        return { maxPlayersPerTeam: 8, minPlayersPerTeam: 5, teamsPerGame: 1 };
      case GameModes.TEN_V_TEN:
        return { maxPlayersPerTeam: 10, minPlayersPerTeam: 7, teamsPerGame: 1 };
      case GameModes.ELEVEN_V_ELEVEN:
        return { maxPlayersPerTeam: 11, minPlayersPerTeam: 8, teamsPerGame: 1 };
    }
  }

  async incrementViewCount(sessionUid: string): Promise<void> {
    await this.prisma.sessions.update({
      data: { viewCount: { increment: 1 } },
      where: { uid: sessionUid },
    });
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

  async findTeamsBySessionUid(
    sessionUid: string,
    userUid: string,
  ): Promise<PaginatedDataDto<SessionTeamResponseData>> {
    const existingSession = await this.findOne(sessionUid);

    if (!existingSession) {
      this.logger.error(`Session ${sessionUid} not found`);
      throw new NotFoundException(`Session ${sessionUid} not found`);
    }

    return await this.teamsService.findTeamsBySessionUid(sessionUid, userUid);
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
    const existingTeam = await this.prisma.sessionTeams.findUnique({
      select: {
        _count: { select: { sessionPlayers: true } },
        sessionUid: true,
      },
      where: { uid: createSessionPlayerDto.teamUid },
    });

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
