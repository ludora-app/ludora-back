import { SessionSportLevel, Sport } from 'src/shared/constants/constants';
import { FieldType, GameModes, Sessions, SessionVisibility } from 'generated/prisma/client';

import { SessionResponseData } from '../dto/output/session-response.dto';
import { SessionTeamMapper, SessionTeamWithPlayers } from './session-team.mapper';
import { SessionCollectionItemDto } from '../dto/output/session-collection-response.dto';
import { FindOneSessionResponseData } from '../dto/output/find-one-session-response.dto';

/**
 * @description Raw session data retrieved for the findAll operations
 */
export interface RawSessionCollectionItem {
  uid: string;
  endDate: Date;
  sport: string;
  level: number;
  startDate: Date;
  gameMode: string;
  creatorUid: string;
  maxPlayersPerTeam: number;
  visibility?: SessionVisibility;
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
 * @description Raw session data retrieved for the findOne operation
 */
export interface RawSessionFindOneItem {
  uid: string;
  title: string;
  endDate: Date;
  sport: string;
  level: number;
  startDate: Date;
  gameMode: string;
  isJoined: boolean;
  creatorUid: string;
  description: string;
  maxPlayersPerTeam: number;
  remainingPlayers?: number;
  creatorSessionsCount?: number;
  visibility?: SessionVisibility;
  sessionTeams: SessionTeamWithPlayers[];
  creator?: {
    firstname: string;
    lastname: string;
    imageUrl: string | null;
  };
  field: {
    latitude: number;
    longitude: number;
    shortAddress: string;
    fieldImages: { order: number; url: string }[];
    uid: string;
    type: FieldType;
  };
}

/**
 * @description Mapper for the Session entity
 * Allows the response to return a session.sport as Sport enum instead of a string
 * without having to cast it in the controller nor change the prisma schemas
 */
export class SessionMapper {
  static toDto(session: Sessions): SessionResponseData {
    return {
      ...session,
      sport: session.sport as Sport,
    };
  }

  static toFindOneDto(session: RawSessionFindOneItem): FindOneSessionResponseData {
    const { field, sessionTeams } = session;

    const response: FindOneSessionResponseData = {
      creatorUid: session.creatorUid,
      description: session.description,
      endDate: session.endDate,
      fieldImages: field.fieldImages.map((image) => ({
        order: image.order,
        url: image.url,
      })),
      fieldLatitude: field.latitude,

      fieldLongitude: field.longitude,
      fieldShortAddress: field.shortAddress,
      fieldType: field.type,
      fieldUid: field.uid,
      gameMode: session.gameMode as GameModes,

      isJoined: session.isJoined,
      level: session.level as SessionSportLevel,
      maxPlayersPerTeam: session.maxPlayersPerTeam,
      remainingPlayers: session.remainingPlayers,
      sessionTeams: SessionTeamMapper.toDtoList(sessionTeams, session.maxPlayersPerTeam),
      sport: session.sport as Sport,
      startDate: session.startDate,
      title: session.title,
      uid: session.uid,
      visibility: session.visibility as SessionVisibility,
    };

    if (session.creator && session.creatorSessionsCount !== undefined) {
      response.creator = {
        firstname: session.creator.firstname,
        imageUrl: session.creator.imageUrl,
        lastname: session.creator.lastname,
        sessionsCount: session.creatorSessionsCount,
      };
    }

    return response;
  }

  /**
   *
   * @param session - Raw session data from the database
   * @returns Session collection item
   */
  static fromRawToCollectionItem(
    session: RawSessionCollectionItem,
    distanceMap: Map<string, { distance: number | null; index: number }>,
  ): SessionCollectionItemDto {
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
      visibility: sessionData.visibility as SessionVisibility,

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
    sessions: RawSessionCollectionItem[],
    distanceMap: Map<string, { distance: number | null; index: number }>,
  ): SessionCollectionItemDto[] {
    return sessions.map((session) => SessionMapper.fromRawToCollectionItem(session, distanceMap));
  }
}
