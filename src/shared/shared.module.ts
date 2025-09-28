import { Module } from '@nestjs/common';
import { makeCounterProvider, PrometheusModule } from '@willsoto/nestjs-prometheus';

import { AwsService } from './aws/aws.service';
import { AwsController } from './aws/aws.controller';
import { EmailsService } from './emails/emails.service';
import { ImagesService } from './images/images.service';
import { MetricsService } from './metrics/metrics.service';
import { EmailsController } from './emails/emails.controller';
import { MetricsController } from './metrics/metrics.controller';
import { WebsocketsService } from './websockets/websockets.service';
import { WebsocketsGateway } from './websockets/websockets.gateway';

@Module({
  controllers: [EmailsController, AwsController, MetricsController, MetricsController],
  exports: [EmailsService, AwsService, ImagesService, WebsocketsGateway, WebsocketsService],
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
    }),
  ],
  providers: [
    EmailsService,
    AwsService,
    ImagesService,
    WebsocketsGateway,
    WebsocketsService,
    MetricsService,
    makeCounterProvider({
      help: 'Active users',
      name: 'active_users',
    }),
  ],
})
export class SharedModule {}
