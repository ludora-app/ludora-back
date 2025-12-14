import { Sport } from 'src/shared/constants/constants';
import { GameModes, Sessions } from 'generated/prisma/client';

import { SessionResponse } from '../dto/output/session.response';
import { SessionCollectionItem } from '../dto/output/session-collection.response';
import { SessionCollectionSuggestionItem } from '../dto/output/session-collection-suggestion.response';

export interface RawSession {
  uid: string;
  endDate: Date;
  sport: string;
  startDate: Date;
  gameMode: string;
  distance?: number;
  creatorUid: string;
  fieldLatitude: number;
  fieldLongitude: number;
  maxPlayersPerTeam: number;
  fieldShortAddress: string;
  fieldImage: string | null;
  sessionTeams: Array<{ teamName: string; numberOfPlayers: number }> | null;
}

export interface RawSessionSuggestion {
  uid: string;
  endDate: Date;
  sport: string;
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
  static fromRawToCollectionItem(session: RawSession): SessionCollectionItem {
    return {
      creatorUid: session.creatorUid,
      endDate: session.endDate,
      fieldImage: session.fieldImage || undefined,
      fieldLatitude: session.fieldLatitude,
      fieldLongitude: session.fieldLongitude,
      fieldShortAddress: session.fieldShortAddress,
      gameMode: session.gameMode as GameModes,
      maxPlayersPerTeam: session.maxPlayersPerTeam,
      sessionTeams: session.sessionTeams || [],
      sport: session.sport as Sport,
      startDate: session.startDate,
      uid: session.uid,
    };
  }

  /**
   * @param sessions - Raw session data from the database
   * @returns Session collection items
   */
  static fromRawToSessionResponses(sessions: RawSession[]): SessionCollectionItem[] {
    return sessions.map(SessionMapper.fromRawToCollectionItem);
  }

  /**
   * @description Maps a single raw session + distance map to a Suggestion Item
   */
  static toCollectionSuggestionDto(
    session: RawSessionSuggestion,
    distanceMap: Map<string, { distance: number | null; index: number }>,
  ): SessionCollectionSuggestionItem {
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
   * @description Maps raw sessions array to Suggestion Items array
   */
  static toSessionCollectionSuggestionItems(
    sessions: RawSessionSuggestion[],
    distanceMap: Map<string, { distance: number | null; index: number }>,
  ): SessionCollectionSuggestionItem[] {
    return sessions.map((session) => SessionMapper.toCollectionSuggestionDto(session, distanceMap));
  }
}
