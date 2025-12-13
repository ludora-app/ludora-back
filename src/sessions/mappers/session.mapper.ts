import { Sessions } from 'generated/prisma/client';
import { GameModes } from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';

import { SessionResponse } from '../dto/output/session.response';
import { SessionCollectionItem } from '../dto/output/session-collection.response';

/**
 * @description Mapper for the Session entity
 * Allows the response to return a session.sport as Sport enum instead of a string
 * without having to cast it in the controller nor change the prisma schemas
 */
export class SessionMapper {
  static toSessionResponse(session: Sessions): SessionResponse {
    return {
      ...session,
      sport: session.sport as Sport,
    };
  }

  static toSessionResponses(sessions: Sessions[]): SessionResponse[] {
    return sessions.map(SessionMapper.toSessionResponse);
  }

  /**
   * @description Maps a session with nested field data to a flattened SessionCollectionItem
   * @param session Session object with nested field containing fieldImages, latitude, longitude, shortAddress
   * @returns SessionCollectionItem with flattened field properties
   */
  static toSessionCollectionItem(session: {
    uid: string;
    creatorUid: string;
    startDate: Date;
    endDate: Date;
    sport: string;
    gameMode: string;
    maxPlayersPerTeam: number;
    field: {
      fieldImages: { url: string }[];
      latitude: number;
      longitude: number;
      shortAddress: string;
    };
  }): SessionCollectionItem {
    const { field, ...sessionData } = session;

    return {
      ...sessionData,
      fieldImage: field.fieldImages.length > 0 ? field.fieldImages[0].url : '',
      fieldLatitude: field.latitude,
      fieldLongitude: field.longitude,
      fieldShortAddress: field.shortAddress,
      gameMode: session.gameMode as GameModes,
      sport: session.sport as Sport,
    };
  }

  /**
   * @description Maps an array of sessions with nested field data to SessionCollectionItem array
   * @param sessions Array of session objects with nested field data
   * @returns Array of SessionCollectionItem with flattened field properties
   */
  static toSessionCollectionItems(
    sessions: Array<{
      uid: string;
      creatorUid: string;
      startDate: Date;
      endDate: Date;
      sport: string;
      gameMode: string;
      maxPlayersPerTeam: number;
      field: {
        fieldImages: { url: string }[];
        latitude: number;
        longitude: number;
        shortAddress: string;
      };
    }>,
  ): SessionCollectionItem[] {
    return sessions.map(SessionMapper.toSessionCollectionItem);
  }
}
