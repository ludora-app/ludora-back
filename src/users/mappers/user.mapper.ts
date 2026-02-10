import { SportPreferencesMapper } from 'src/user-preferences/mappers/sport-preferences.mapper';
import { GameModes, TimePeriod, UserHourPreferenceType, UserType } from 'generated/prisma/enums';

import { FindMeUserResponseData } from '../dto';

export interface RawUserFindMe {
  bio: string;
  uid: string;
  email: string;
  phone: string;
  type: UserType;
  birthdate: Date;
  imageUrl: string;
  lastname: string;
  firstname: string;
  isConnected: boolean;
  stripeAccountId: string;
  isEmailVerified: boolean;
  userHourPreferences: {
    date: Date;
    dayOfWeek: number;
    timePeriod: TimePeriod;
    type: UserHourPreferenceType;
  }[];

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

export class UserMapper {
  static toFindMeResponseDto(user: RawUserFindMe): FindMeUserResponseData {
    return {
      active: user.isConnected,
      bio: user.bio,
      birthdate: user.birthdate,
      email: user.email,
      firstname: user.firstname,
      imageUrl: user.imageUrl,
      isEmailVerified: user.isEmailVerified,
      lastname: user.lastname,
      name: `${user.firstname} ${user.lastname}`,
      phone: user.phone,
      profileStatus: user.userSportPreferences.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
      sportPreferences: user.userSportPreferences.map((sportPreference) =>
        SportPreferencesMapper.toSimpleDisplay(sportPreference),
      ),
      stripeAccountUid: user.stripeAccountId,
      type: user.type,
      uid: user.uid,
    };
  }
}
