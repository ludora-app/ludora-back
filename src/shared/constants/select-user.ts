// ? This files contains the common select objects for the users service

import { Prisma } from '@prisma/client';

export const USERSELECT: Record<string, Prisma.UsersSelect> = {
  findAll: {
    email: true,
    firstname: true,
    sex: true,
    stripeAccountUid: true,
    type: true,
    uid: true,
  },

  findMe: {
    bio: true,
    birthdate: true,
    email: true,
    firstname: true,
    imageUrl: true,
    isConnected: true,
    lastname: true,
    phone: true,
    stripeAccountUid: true,
    type: true,
    uid: true,
  },
  findOne: {
    bio: true,
    firstname: true,
    imageUrl: true,
    lastname: true,
    uid: true,
  },
};
