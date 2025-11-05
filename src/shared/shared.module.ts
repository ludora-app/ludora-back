import { Module } from '@nestjs/common';

import { EmailsService } from './emails/emails.service';
import { StorageService } from './storage/storage.service';
import { EmailsController } from './emails/emails.controller';
import { StorageController } from './storage/storage.controller';
import { MetricsController } from '../metrics/metrics.controller';
import { WebsocketsService } from './websockets/websockets.service';
import { WebsocketsGateway } from './websockets/websockets.gateway';
import { GeolocalisationService } from './geolocalisation/geolocalisation.service';

@Module({
  controllers: [EmailsController, StorageController, MetricsController, MetricsController],
  exports: [
    EmailsService,
    StorageService,
    WebsocketsGateway,
    WebsocketsService,
    GeolocalisationService,
  ],
  providers: [
    EmailsService,
    StorageService,
    WebsocketsGateway,
    WebsocketsService,
    GeolocalisationService,
  ],
})
export class SharedModule {}
