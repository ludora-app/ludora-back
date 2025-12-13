import { Sessions } from 'generated/prisma/client';
import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';

import { SessionResponse } from '../dto/output/session.response';
import { SessionCollectionItem } from '../dto/output/session-collection.response';

interface RawSession {
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
    fieldImages: { url: string }[];
    latitude: number;
    longitude: number;
    shortAddress: string;
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
   * @description Maps a session with nested field data to a flattened SessionCollectionItem
   * @param session Session object with nested field containing fieldImages, latitude, longitude, shortAddress
   * @returns SessionCollectionItem with flattened field properties
   */
  static toCollectionDto(session: RawSession): SessionCollectionItem {
    const { field, sessionTeams, ...sessionData } = session;

    return {
      ...sessionData,
      fieldImage: field.fieldImages.length > 0 ? field.fieldImages[0].url : '',
      fieldLatitude: field.latitude,
      fieldLongitude: field.longitude,
      fieldShortAddress: field.shortAddress,
      gameMode: session.gameMode as GameModes,
      sessionTeams: sessionTeams.map((team) => ({
        numberOfPlayers: team._count.sessionPlayers,
        teamName: team.teamName,
      })),
      sport: session.sport as Sport,
    };
  }

  /**
   * @description Maps an array of sessions with nested field data to SessionCollectionItem array
   * @param sessions Array of session objects with nested field data
   * @returns Array of SessionCollectionItem with flattened field properties
   */
  static toSessionCollectionItems(sessions: RawSession[]): SessionCollectionItem[] {
    return sessions.map(SessionMapper.toCollectionDto);
  }
}
