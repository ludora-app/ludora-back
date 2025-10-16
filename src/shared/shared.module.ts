import { Module } from '@nestjs/common';
import { makeCounterProvider, PrometheusModule } from '@willsoto/nestjs-prometheus';

import { EmailsService } from './emails/emails.service';
import { ImagesService } from './images/images.service';
import { MetricsService } from './metrics/metrics.service';
import { StorageService } from './storage/storage.service';
import { EmailsController } from './emails/emails.controller';
import { MetricsController } from './metrics/metrics.controller';
import { StorageController } from './storage/storage.controller';
import { WebsocketsService } from './websockets/websockets.service';
import { WebsocketsGateway } from './websockets/websockets.gateway';
import { GeolocalisationService } from './geolocalisation/geolocalisation.service';

@Module({
  controllers: [EmailsController, StorageController, MetricsController, MetricsController],
  exports: [
    EmailsService,
    StorageService,
    ImagesService,
    WebsocketsGateway,
    WebsocketsService,
    GeolocalisationService,
  ],
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
    }),
  ],
  providers: [
    EmailsService,
    StorageService,
    ImagesService,
    WebsocketsGateway,
    WebsocketsService,
    MetricsService,
    makeCounterProvider({
      help: 'Active users',
      name: 'active_users',
    }),
    GeolocalisationService,
  ],
})
export class SharedModule {}
