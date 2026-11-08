import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Users } from 'generated/prisma/client';
import { InvitationStatus, UserHourPreferenceType } from 'generated/prisma/enums';
import { DateTime } from 'luxon';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { LOCAL_TIME_ZONE, SessionSportLevel } from 'src/shared/constants/constants';
import { PaginatedDataDto } from 'src/shared/dto/responses/pagination-response-type';
import { DateUtils } from 'src/shared/utils/date.utils';
import { USERSELECT } from '../../shared/constants/select-user';
import {
  CompatibleUserCollectionItemDto,
  CompatibleUserFilterDto,
  PlayAreaResponseData,
} from '../dto';
import { SearchLocation } from '../interfaces/search-location.interface';
import { RawCompatibleUser, UserMapper } from '../mappers/user.mapper';

// Kilometers per degree of latitude, rounded down so that the pre-filter never drops a player in range
const KM_PER_LATITUDE_DEGREE = 111;

/**
 * @description Read-only access to users.
 * Used by the guards, the auth services and other domains that only need to look up a user,
 * so they don't depend on the whole UsersService and its mutations.
 */
@Injectable()
export class UserLookupService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserLookupService.name);
  }

  /**
   * Find a user by uid
   * @param uid - The uid of the user
   * @param select - The fields to select
   * @param searcherUid - If provided, returns null when a block exists between the two users
   * @returns The user, or null if not found or blocked
   */
  async findOne(
    uid: string,
    select: Prisma.UsersSelect,
    searcherUid?: string,
  ): Promise<Users | null> {
    const existingUser = await this.prismaService.users.findUnique({
      select: {
        ...select,
      },
      where: { uid },
    });

    if (!existingUser) {
      this.logger.debug(`User not found: ${uid}`);
      return null;
    }

    if (searcherUid) {
      const existingBlock = await this.prismaService.userBlocks.findFirst({
        where: {
          OR: [
            { blockerUid: searcherUid, blockedUid: uid },
            { blockerUid: uid, blockedUid: searcherUid },
          ],
        },
      });

      if (existingBlock) {
        this.logger.debug(`User ${uid} hidden from ${searcherUid} because of a block`);
        return null;
      }
    }

    return existingUser;
  }

  /**
   * Find a user by email
   * @param email - The email of the user
   * @description This method is used in the auth service to find a user by email
   * @returns The user, or null if not found
   */
  async findOneByEmail(email: string, select?: Prisma.UsersSelect): Promise<Users | null> {
    const user = await this.prismaService.users.findUnique({
      select: select ?? USERSELECT.checkIfUserExistsByEmail,
      where: { email },
    });

    if (!user) return null;

    return user;
  }

  async findOneByAppleId(appleId: string) {
    const user = await this.prismaService.users.findUnique({
      select: USERSELECT.findOneByAppleId,
      where: { appleId },
    });

    if (!user) return null;

    return user;
  }

  /**
   * Find the play area of a user
   * @param uid - The uid of the user
   * @returns The play area, or null if the user has not set one
   */
  async findPlayArea(uid: string): Promise<PlayAreaResponseData | null> {
    const user = await this.prismaService.users.findUnique({
      select: {
        playAreaLatitude: true,
        playAreaLongitude: true,
        playAreaRadiusKm: true,
      },
      where: { uid },
    });

    const playArea = user ? UserMapper.toPlayAreaDto(user) : null;
    if (!playArea) {
      this.logger.debug(`No play area for user ${uid}`);
      return null;
    }

    return playArea;
  }

  /**
   * Find the players compatible with a session, published or not: same sport at one level apart,
   * one of their formats when they chose some, available on the session's slot (Paris time), and
   * whose play area contains the field. Players without a play area come last, without distance.
   * For a published session, its own characteristics are used and the caller must be its creator
   * or one of its players.
   * @param userUid - The uid of the player inviting
   * @param filter - The characteristics of the session
   * @returns The compatible players, by distance then closest level
   */
  async findCompatible(
    userUid: string,
    filter: CompatibleUserFilterDto,
  ): Promise<PaginatedDataDto<CompatibleUserCollectionItemDto>> {
    const { cursor, limit = 10, sessionUid } = filter;
    const { fieldUid, gameMode, level, sport, startDate } = sessionUid
      ? await this.findSessionCriteria(userUid, sessionUid)
      : filter;
    this.logger.debug(`Finding players compatible with a ${sport} session on field ${fieldUid}`);

    const field = await this.prismaService.fields.findUnique({
      select: { latitude: true, longitude: true },
      where: { uid: fieldUid },
    });
    if (!field) {
      this.logger.warn(`Field not found: ${fieldUid}`);
      throw new NotFoundException('Field not found');
    }

    const localStart = DateTime.fromISO(startDate).setZone(LOCAL_TIME_ZONE);
    const period = DateUtils.getPeriodForHour(localStart.hour);
    if (!period) {
      this.logger.debug(`No time period for the hour ${localStart.hour}, no compatible player`);
      return { items: [], nextCursor: null, totalCount: 0 };
    }
    // Same day numbering as the hour preferences: 0 is Sunday (PostgreSQL DOW)
    const dayOfWeek = localStart.weekday % 7;
    const localDate = localStart.toISODate();

    // The DTO only lets digits through
    const currentOffset = cursor ? Number.parseInt(cursor, 10) : 0;
    const isAnyLevel = level === SessionSportLevel.ANY;
    const levelWhereSql = isAnyLevel ? Prisma.empty : Prisma.sql`AND ABS(us.level - ${level}) <= 1`;
    // Every level fits a session open to all levels: no level order between the players
    const levelOrderSql = isAnyLevel ? Prisma.empty : Prisma.sql`ABS(level - ${level}) ASC,`;
    const gameModeWhereSql = gameMode
      ? Prisma.sql`
        AND (
          NOT EXISTS (
            SELECT 1 FROM user_preferences."User_game_mode_preferences" gm
            WHERE gm.user_uid = u.uid AND gm.sport = ${sport}
          )
          OR EXISTS (
            SELECT 1 FROM user_preferences."User_game_mode_preferences" gm
            WHERE gm.user_uid = u.uid AND gm.sport = ${sport} AND gm."gameMode"::text = ${gameMode}
          )
        )`
      : Prisma.empty;
    // A canceled or rejected invitation can be sent again (see SessionInvitationsService.createMany)
    const sessionWhereSql = sessionUid
      ? Prisma.sql`
        AND NOT EXISTS (
          SELECT 1 FROM sessions."Session_players" sp
          WHERE sp.session_uid = ${sessionUid} AND sp.user_uid = u.uid
        )
        AND NOT EXISTS (
          SELECT 1 FROM sessions."Session_invitations" si
          WHERE si.session_uid = ${sessionUid} AND si.receiver_uid = u.uid
            AND si.status::text IN (${InvitationStatus.PENDING}, ${InvitationStatus.ACCEPTED})
        )`
      : Prisma.empty;

    // The candidates compute the distance once; the outer query keeps the fields inside the play area
    const rows = await this.prismaService.$queryRaw<RawCompatibleUser[]>`
      WITH candidates AS (
        SELECT
          u.uid, u.firstname, u.lastname, u.image_url, us.level, u.play_area_radius_km,
          CASE WHEN u.play_area_latitude IS NULL OR u.play_area_longitude IS NULL THEN NULL
          ELSE public.ST_DistanceSphere(
            public.ST_MakePoint(u.play_area_longitude::float, u.play_area_latitude::float),
            public.ST_MakePoint(${field.longitude}::float, ${field.latitude}::float)
          ) END AS distance_m
        FROM auth."Users" u
        JOIN user_preferences."User_sports" us ON us.user_uid = u.uid AND us.sport = ${sport}
        WHERE
          u.uid <> ${userUid}
          AND u.deleted_at IS NULL
          AND u.is_banned = false
          AND u.is_anonymized = false
          ${levelWhereSql}
          ${gameModeWhereSql}
          AND EXISTS (
            SELECT 1 FROM user_preferences."User_hour_preferences" hp
            WHERE hp.user_uid = u.uid
              AND hp.time_period::text = ${period}
              AND (
                (hp.type::text = ${UserHourPreferenceType.RECURRENT} AND hp.day_of_week = ${dayOfWeek})
                OR (
                  hp.type::text = ${UserHourPreferenceType.ONE_TIME}
                  AND (hp.date AT TIME ZONE 'UTC' AT TIME ZONE ${LOCAL_TIME_ZONE})::date = ${localDate}::date
                )
              )
          )
          -- Cheap pre-filter on the latitude before the spherical distance
          AND (
            u.play_area_latitude IS NULL
            OR u.play_area_longitude IS NULL
            OR ABS(u.play_area_latitude::float - ${field.latitude}::float) * ${KM_PER_LATITUDE_DEGREE}
              <= u.play_area_radius_km
          )
          AND NOT EXISTS (
            SELECT 1 FROM moderation."User_blocks" ub
            WHERE (ub.blocker_uid = ${userUid} AND ub.blocked_uid = u.uid)
               OR (ub.blocker_uid = u.uid AND ub.blocked_uid = ${userUid})
          )
          ${sessionWhereSql}
      )
      SELECT
        uid, firstname, lastname, image_url, level, distance_m,
        count(*) OVER() AS total_count
      FROM candidates
      WHERE distance_m IS NULL OR distance_m <= play_area_radius_km * 1000
      ORDER BY
        distance_m ASC NULLS LAST,
        ${levelOrderSql}
        uid ASC
      LIMIT ${limit + 1}
      OFFSET ${currentOffset};
    `;

    this.logger.debug(`Found ${rows.length} compatible player rows for field ${fieldUid}`);

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      rows.pop();
      nextCursor = (currentOffset + limit).toString();
    }

    return {
      items: rows.map(UserMapper.toCompatibleUserDto),
      nextCursor,
      totalCount: rows.length ? Number(rows[0].total_count) : 0,
    };
  }

  /**
   * The characteristics of a published session, for its creator or one of its players only:
   * anyone else could learn who plays in or was invited to it
   */
  private async findSessionCriteria(
    userUid: string,
    sessionUid: string,
  ): Promise<
    Pick<CompatibleUserFilterDto, 'fieldUid' | 'gameMode' | 'level' | 'sport' | 'startDate'>
  > {
    const session = await this.prismaService.sessions.findUnique({
      select: {
        creatorUid: true,
        fieldUid: true,
        gameMode: true,
        level: true,
        sessionPlayers: { select: { userUid: true }, where: { userUid } },
        sport: true,
        startDate: true,
      },
      where: { uid: sessionUid },
    });
    if (!session) {
      this.logger.warn(`Session not found: ${sessionUid}`);
      throw new NotFoundException('Session not found');
    }
    if (session.creatorUid !== userUid && session.sessionPlayers.length === 0) {
      this.logger.warn(
        `User ${userUid} is neither the creator nor a player of session ${sessionUid}`,
      );
      throw new ForbiddenException('You are not part of this session');
    }

    return {
      fieldUid: session.fieldUid,
      gameMode: session.gameMode,
      level: session.level as SessionSportLevel,
      sport: session.sport as CompatibleUserFilterDto['sport'],
      startDate: session.startDate.toISOString(),
    };
  }

  /**
   * Complete a geographic search with the play area of the user when the app sends no position:
   * the center of the play area replaces the position, and its radius the missing max distance.
   * A position sent by the app is always used as is.
   * @param location - The position and max distance sent by the app
   * @param userUid - The uid of the user making the search
   * @returns The location to search around, unchanged if the user has no play area
   */
  async resolveSearchLocation(location: SearchLocation, userUid: string): Promise<SearchLocation> {
    const { maxDistance, userLat, userLon } = location;
    if (userLat != null && userLon != null) return location;

    const playArea = await this.findPlayArea(userUid);
    if (!playArea) return location;

    this.logger.debug(`Searching around the play area of user ${userUid}`);
    return {
      maxDistance: maxDistance ?? playArea.radiusKm,
      userLat: playArea.latitude,
      userLon: playArea.longitude,
    };
  }
}
