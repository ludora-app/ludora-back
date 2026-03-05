import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl,
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
    });
  }

  async onModuleInit() {
    if (process.env.SWAGGER_ONLY === 'true') return;
    await this.$connect();
  }

  async onModuleDestroy() {
    if (process.env.SWAGGER_ONLY === 'true') return;
    await this.$disconnect();
  }
}
