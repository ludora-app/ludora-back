import { Gauge } from 'prom-client';
import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectMetric('active_users') private activeUsersGauge: Gauge<string>,
    private readonly userService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    const activeUsers = await this.userService.getActiveUsersCount();
    this.logger.debug(`Cron job "activeUsersCounter" executed: ${activeUsers} active users`);

    this.activeUsersGauge.set(activeUsers);
  }
}
