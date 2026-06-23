import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { PinoLogger } from 'nestjs-pino';
import { Gauge } from 'prom-client';
import { SessionInvitationsService } from 'src/sessions/services/session-invitations.service';
import { SessionsService } from 'src/sessions/services/sessions.service';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('sessions_created_last_24_hours')
    private sessionsCreatedLast24HoursGauge: Gauge<string>,
    @InjectMetric('total_pending_invitations') private totalPendingInvitationsGauge: Gauge<string>,
    private readonly sessionsService: SessionsService,
    private readonly sessionInvitationsService: SessionInvitationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MetricsService.name);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCronDaily() {
    const sessionsCreatedLast24Hours = await this.sessionsService.getCreatedSessionsCount();
    this.sessionsCreatedLast24HoursGauge.set(sessionsCreatedLast24Hours);
    const totalPendingInvitations =
      await this.sessionInvitationsService.getTotalPendingInvitations();
    this.totalPendingInvitationsGauge.set(totalPendingInvitations);
  }
}
