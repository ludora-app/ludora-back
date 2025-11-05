import { Gauge } from 'prom-client';
import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { SessionsService } from 'src/sessions/sessions.service';
import { SessionInvitationsService } from 'src/session-invitations/session-invitations.service';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectMetric('active_users') private activeUsersGauge: Gauge<string>,
    @InjectMetric('sessions_created_last_24_hours')
    private sessionsCreatedLast24HoursGauge: Gauge<string>,
    @InjectMetric('total_pending_invitations') private totalPendingInvitationsGauge: Gauge<string>,
    private readonly userService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly sessionInvitationsService: SessionInvitationsService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCronThirtySeconds() {
    const activeUsers = await this.userService.getActiveUsersCount();
    this.logger.debug(`Cron job "activeUsersCounter" executed: ${activeUsers} active users`);

    this.activeUsersGauge.set(activeUsers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCronDaily() {
    const sessionsCreatedLast24Hours = await this.sessionsService.getCreatedSessionsCount();
    this.logger.debug(
      `Cron job "sessionsCreatedLast24HoursCounter" executed: ${sessionsCreatedLast24Hours} sessions created within the last 24 hours`,
    );

    this.sessionsCreatedLast24HoursGauge.set(sessionsCreatedLast24Hours);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronFiveMinutes() {
    const totalPendingInvitations =
      await this.sessionInvitationsService.getTotalPendingInvitations();
    this.logger.debug(
      `Cron job "totalPendingInvitationsCounter" executed: ${totalPendingInvitations} total pending invitations`,
    );

    this.totalPendingInvitationsGauge.set(totalPendingInvitations);
  }
}
