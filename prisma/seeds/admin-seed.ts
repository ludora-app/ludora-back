import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { Pool } from 'pg';
import { OnBoardingStatus, PrismaClient, Provider, UserType } from '../../generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

const admins = [
  {
    email: process.env.ADMIN_1_EMAIL,
    password: process.env.ADMIN_1_PASSWORD,
  },
  {
    email: process.env.ADMIN_2_EMAIL,
    password: process.env.ADMIN_2_PASSWORD,
  },
];

async function main() {
  for (const admin of admins) {
    if (!admin.password) throw new Error(`ADMIN_PASSWORD non défini pour ${admin.email}`);

    await prisma.users.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        password: await hashPassword(admin.password),
        type: UserType.ADMIN,
        isEmailVerified: true,
        onBoardingStatus: OnBoardingStatus.COMPLETE,
        provider: Provider.LUDORA,
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
