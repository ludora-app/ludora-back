import { Sport } from 'src/shared/constants/constants';
import { GameModes, Sessions } from 'generated/prisma/client';

import { SessionResponse } from '../dto/output/session.response';
import { SessionCollectionItem } from '../dto/output/session-collection.response';

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
}
