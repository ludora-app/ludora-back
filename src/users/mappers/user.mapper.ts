import {
  GameModes,
  InvitationStatus,
  OnBoardingStatus,
  Provider,
  Sex,
  TimePeriod,
  UserHourPreferenceType,
  UserType,
} from 'generated/prisma/enums';
import { Sport } from 'src/shared/constants/constants';
import { SportPreferencesMapper } from 'src/user-preferences/mappers/sport-preferences.mapper';
import {
  FindAllUsersResponseDataDto,
  FindMeUserResponseData,
  FindOneUserResponseData,
} from '../dto';

export interface RawUserFindOne {
  bio: string;
  uid: string;
  city: string;
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
  onBoardingStatus: OnBoardingStatus;
  provider: Provider;
  userHourPreferences: {
    date: Date;
    dayOfWeek: number;
    timePeriod: TimePeriod;
    type: UserHourPreferenceType;
  }[];
}

export interface RawUserFindAll {
  bio: string;
  uid: string;
  city: string;
  imageUrl: string;
  lastname: string;
  firstname: string;
  userSportPreferences: {
    sport: string;
    level: number;
    uid: string;
    userGameModePreferences: {
      gameMode: GameModes;
      uid: string;
    }[];
  }[];
}

export class UserMapper {
  static toFindOneResponseDto(user: RawUserFindOne): FindOneUserResponseData {
    return {
      bio: user.bio,
      city: user.city,
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
      city: user.city,
      email: user.email,
      firstname: user.firstname,
      friendsCount: user._count.friendsReceived + user._count.friendsSent,
      imageUrl: user.imageUrl,
      isEmailVerified: user.isEmailVerified,
      lastname: user.lastname,
      matchesCount: user._count.sessionPlayers,
      name: `${user.firstname} ${user.lastname}`,
      onBoardingStatus: user.onBoardingStatus,
      phone: user.phone,
      profileStatus: user.userSportPreferences.length > 0 ? 'COMPLETE' : 'INCOMPLETE',
      provider: user.provider,
      sex: user.sex,
      sportPreferences: user.userSportPreferences.map((sportPreference) =>
        SportPreferencesMapper.toSimpleDisplay(sportPreference),
      ),
      stripeAccountId: user.stripeAccountId,
      type: user.type,
      uid: user.uid,
    };
  }

  static toFindAllResponseDto(
    user: RawUserFindAll,
    connectedUserCity?: string | null,
    connectedUserSports: string[] = [],
    invitationStatus?: InvitationStatus | null,
  ): FindAllUsersResponseDataDto {
    const userSports = user.userSportPreferences.map((p) => p.sport);
    const commonSports = userSports.filter((sport) => connectedUserSports.includes(sport));

    return {
      bio: user.bio,
      commonSports: commonSports as Sport[],
      firstname: user.firstname,
      imageUrl: user.imageUrl,
      invitationStatus,
      isSameCity: !!connectedUserCity && !!user.city && connectedUserCity === user.city,
      lastname: user.lastname,
      name: `${user.firstname} ${user.lastname}`,
      sportPreferences: user.userSportPreferences.map((sportPreference) =>
        SportPreferencesMapper.toFindAllDisplay(sportPreference),
      ),
      uid: user.uid,
      userCity: user.city,
    };
  }
}
