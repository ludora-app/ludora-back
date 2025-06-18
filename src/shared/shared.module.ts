import { Module } from '@nestjs/common';

import { AwsService } from './aws/aws.service';
import { AwsController } from './aws/aws.controller';
import { EmailsService } from './emails/emails.service';
import { EmailsController } from './emails/emails.controller';
import { MetricsController } from './metrics/metrics.controller';
import { WebsocketsService } from './websockets/websockets.service';
import { WebsocketsGateway } from './websockets/websockets.gateway';
import { ImagesService } from './infrastructure/services/images.service';
import { FileStoragePort } from './domain/repositories/file-storage.port';

@Module({
  controllers: [EmailsController, AwsController, MetricsController, MetricsController],
  exports: [EmailsService, FileStoragePort, ImagesService, WebsocketsGateway, WebsocketsService],
  imports: [],
  providers: [
    EmailsService,
    AwsService,
    { provide: FileStoragePort, useClass: AwsService },
    ImagesService,
    WebsocketsGateway,
    WebsocketsService,
  ],
})
export class SharedModule {}
