import { Counter, Gauge } from 'prom-client';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private activeUsersGauge: Gauge<string>;

  constructor(
    private readonly prisma: PrismaService,
    @InjectMetric('active_users') public activeUsersCounter: Counter<string>,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    this.logger.debug('Cron job "activeUsersCounter" executed');

    const activeUsers = await this.prisma.users.count({
      where: {
        isConnected: true,
      },
    });
    this.activeUsersCounter.inc(activeUsers);
  }
}
