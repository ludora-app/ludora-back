// ? This files contains the common select objects for the users service

import { Prisma } from '@prisma/client';

export const USERSELECT: Record<string, Prisma.UsersSelect> = {
  findOne: {
    bio: true,
    firstname: true,
    id: true,
    imageUrl: true,
    lastname: true,
  },
  findMe: {
    bio: true,
    birthdate: true,
    email: true,
    firstname: true,
    id: true,
    imageUrl: true,
    isConnected: true,
    lastname: true,
    sex: true,
    phone: true,
    stripeAccountId: true,
    type: true,
  },
};
