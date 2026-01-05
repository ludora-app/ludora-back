import { GameModes, Sessions } from 'generated/prisma/client';
import { SessionSportLevel, Sport } from 'src/shared/constants/constants';

import { SessionResponse } from '../dto/output/session.response.dto';
import { SessionCollectionItem } from '../dto/output/session-collection.response.dto';

export interface RawSession {
  uid: string;
  endDate: Date;
  sport: string;
  level: number;
  startDate: Date;
  gameMode: string;
  creatorUid: string;
  maxPlayersPerTeam: number;
  sessionTeams: {
    teamName: string;
    _count: {
      sessionPlayers: number;
    };
  }[];
  field: {
    latitude: number;
    longitude: number;
    shortAddress: string;
    fieldImages: { url: string }[];
  };
}

/**
 * @description Mapper for the Session entity
 * Allows the response to return a session.sport as Sport enum instead of a string
 * without having to cast it in the controller nor change the prisma schemas
 */
export class SessionMapper {
  static toDto(session: Sessions): SessionResponse {
    return {
      ...session,
      sport: session.sport as Sport,
    };
  }

  static toSessionResponses(sessions: Sessions[]): SessionResponse[] {
    return sessions.map(SessionMapper.toDto);
  }

  /**
   *
   * @param session - Raw session data from the database
   * @returns Session collection item
   */
  static fromRawToCollectionItem(
    session: RawSession,
    distanceMap: Map<string, { distance: number | null; index: number }>,
  ): SessionCollectionItem {
    const { field, sessionTeams, ...sessionData } = session;
    const distData = distanceMap.get(session.uid);

    return {
      creatorUid: sessionData.creatorUid,
      endDate: sessionData.endDate,

      fieldImage: field.fieldImages[0]?.url || undefined,
      fieldLatitude: field.latitude,

      fieldLongitude: field.longitude,
      fieldShortAddress: field.shortAddress,
      gameMode: sessionData.gameMode as GameModes,

      level: sessionData.level as SessionSportLevel,
      maxPlayersPerTeam: sessionData.maxPlayersPerTeam,
      sport: sessionData.sport as Sport,
      startDate: sessionData.startDate,
      uid: sessionData.uid,

      // Teams
      sessionTeams: sessionTeams.map((team) => ({
        numberOfPlayers: team._count.sessionPlayers,
        teamName: team.teamName,
      })),

      // Distance
      userDistance: distData?.distance ? Math.round(Number(distData.distance)) : null,
    };
  }
  /**
   * @param sessions - Raw session data from the database
   * @returns Session collection items
   */
  static fromRawToSessionResponses(
    sessions: RawSession[],
    distanceMap: Map<string, { distance: number | null; index: number }>,
  ): SessionCollectionItem[] {
    return sessions.map((session) => SessionMapper.fromRawToCollectionItem(session, distanceMap));
  }
}
