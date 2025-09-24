// ? This files contains the common select objects for the users service

import { Prisma } from '@prisma/client';

export const USERSELECT: Record<string, Prisma.UsersSelect> = {
  findMe: {
    bio: true,
    birthdate: true,
    email: true,
    firstname: true,
    id: true,
    imageUrl: true,
    isConnected: true,
    lastname: true,
    phone: true,
    sex: true,
    stripeAccountId: true,
    type: true,
  },
  findOne: {
    bio: true,
    firstname: true,
    id: true,
    imageUrl: true,
    lastname: true,
  },
};
