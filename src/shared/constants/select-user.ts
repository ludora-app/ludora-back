import { Prisma } from 'generated/prisma/client';
/**
 * This object contains the common select objects for the users service
 * @example
 * const select = USERSELECT.findMe;
 * const user = await this.usersService.findOne(uid, select);
 * return { data: user, message: 'User fetched successfully' };
 */
export const USERSELECT: Record<string, Prisma.UsersSelect> = {
  checkIfUserExists: {
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
    bio: true,
    birthdate: true,
    email: true,
    firstname: true,
    imageUrl: true,
    isConnected: true,
    isEmailVerified: true,
    lastname: true,
    phone: true,
    stripeAccountId: true,
    type: true,
    uid: true,
    userSportPreferences: {
      select: {
        sport: true,
      },
    },
  },

  findOne: {
    bio: true,
    firstname: true,
    imageUrl: true,
    lastname: true,
    uid: true,
    userSportPreferences: {
      select: {
        sport: true,
      },
    },
  },
  findOneByEmail: {
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
