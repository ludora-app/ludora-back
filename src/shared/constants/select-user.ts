import { InvitationStatus, Prisma } from 'generated/prisma/client';
/**
 * This object contains the common select objects for the users service
 * @example
 * const select = USERSELECT.findMe;
 * const user = await this.usersService.findOne(uid, select);
 * return { data: user, message: 'User fetched successfully' };
 */
export const USERSELECT: Record<string, Prisma.UsersSelect> = {
  basicUserInfoDisplay: {
    firstname: true,
    imageUrl: true,
    lastname: true,
    uid: true,
  },

  checkIfUserExists: {
    type: true,
    uid: true,
  },

  checkIfUserExistsByEmail: {
    email: true,
    uid: true,
  },
  createStripeAccountToken: {
    birthdate: true,
    email: true,
    firstname: true,
    lastname: true,
    phone: true,
  },

  createStripeConnectAccount: {
    birthdate: true,
    email: true,
    firstname: true,
    lastname: true,
    stripeAccountId: true,
    uid: true,
  },

  findMe: {
    _count: {
      select: {
        friendsReceived: { where: { status: InvitationStatus.ACCEPTED } },
        friendsSent: { where: { status: InvitationStatus.ACCEPTED } },
        sessionPlayers: true,
      },
    },
    bio: true,
    birthdate: true,
    city: true,
    email: true,
    firstname: true,
    imageUrl: true,
    isConnected: true,
    isEmailVerified: true,
    lastname: true,
    phone: true,
    sex: true,
    stripeAccountId: true,
    type: true,
    uid: true,
    userHourPreferences: {
      select: {
        date: true,
        dayOfWeek: true,
        timePeriod: true,
        type: true,
      },
    },
    userSportPreferences: {
      select: {
        level: true,
        sport: true,
        uid: true,
        userGameModePreferences: {
          select: {
            gameMode: true,
          },
        },
      },
    },
  },
  findOne: {
    _count: {
      select: {
        friendsReceived: { where: { status: InvitationStatus.ACCEPTED } },
        friendsSent: { where: { status: InvitationStatus.ACCEPTED } },
        sessionPlayers: true,
      },
    },
    bio: true,
    city: true,
    firstname: true,
    imageUrl: true,
    lastname: true,
    uid: true,
    userSportPreferences: {
      select: {
        level: true,
        sport: true,
        uid: true,
        userGameModePreferences: {
          select: {
            gameMode: true,
          },
        },
      },
    },
  },

  findOneByEmail: {
    city: true,
    email: true,
    firstname: true,
    imageUrl: true,
    isEmailVerified: true,
    lastname: true,
    provider: true,
    uid: true,
  },
  login: {
    email: true,
    password: true,
    type: true,
    uid: true,
  },
  stripeAccountId: {
    stripeAccountId: true,
  },
};
