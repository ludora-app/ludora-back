import { SportPreferencesMapper } from 'src/user-preferences/mappers/sport-preferences.mapper';
import {
  GameModes,
  Sex,
  TimePeriod,
  UserHourPreferenceType,
  UserType,
} from 'generated/prisma/enums';

import {
  FindAllUsersResponseDataDto,
  FindMeUserResponseData,
  FindOneUserResponseData,
} from '../dto';

export interface RawUserFindOne {
  bio: string;
  uid: string;
  imageUrl: string;
  lastname: string;
  firstname: string;
  _count: {
    friendsReceived: number;
    friendsSent: number;
    sessionPlayers: number;
  };

  userSportPreferences: {
    sport: string;
    level: number;
    uid: string;
    userGameModePreferences: {
      gameMode: GameModes;
      sport: string;
      uid: string;
    }[];
  }[];
}
export interface RawUserFindMe extends RawUserFindOne {
  sex: Sex;
  email: string;
  phone: string;
  type: UserType;
  birthdate: Date;
  isConnected: boolean;
  stripeAccountId: string;
  isEmailVerified: boolean;
  userHourPreferences: {
    date: Date;
    dayOfWeek: number;
    timePeriod: TimePeriod;
    type: UserHourPreferenceType;
  }[];
}

export interface RawUserFindAll {
  uid: string;
  lastname: string;
  imageUrl: string;
  firstname: string;
  userSportPreferences: {
    sport: string;
    level: number;
    uid: string;
  }[];
}

export class UserMapper {
  static toFindOneResponseDto(user: RawUserFindOne): FindOneUserResponseData {
    return {
      bio: user.bio,
      firstname: user.firstname,
      friendsCount: user._count.friendsReceived + user._count.friendsSent,
      imageUrl: user.imageUrl,
      lastname: user.lastname,
      matchesCount: user._count.sessionPlayers,
      name: `${user.firstname} ${user.lastname}`,
      sportPreferences: user.userSportPreferences.map((sportPreference) =>
        SportPreferencesMapper.toSimpleDisplay(sportPreference),
      ),
      uid: user.uid,
    };
  }

  static toFindMeResponseDto(user: RawUserFindMe): FindMeUserResponseData {
    return {
      active: user.isConnected,
      bio: user.bio,
      birthdate: user.birthdate,
      email: user.email,
      firstname: user.firstname,
      friendsCount: user._count.friendsReceived + user._count.friendsSent,
      imageUrl: user.imageUrl,
      isEmailVerified: user.isEmailVerified,
      lastname: user.lastname,
      matchesCount: user._count.sessionPlayers,
      name: `${user.firstname} ${user.lastname}`,
      phone: user.phone,
      profileStatus: user.userSportPreferences.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
      sex: user.sex,
      sportPreferences: user.userSportPreferences.map((sportPreference) =>
        SportPreferencesMapper.toSimpleDisplay(sportPreference),
      ),
      stripeAccountId: user.stripeAccountId,
      type: user.type,
      uid: user.uid,
    };
  }

  static toFindAllResponseDto(user: RawUserFindAll): FindAllUsersResponseDataDto {
    return {
      firstname: user.firstname,
      imageUrl: user.imageUrl,
      lastname: user.lastname,
      sportPreferences: SportPreferencesMapper.toSimpleArrayWithGameModes(
        user.userSportPreferences,
      ),
      uid: user.uid,
    };
  }
}
