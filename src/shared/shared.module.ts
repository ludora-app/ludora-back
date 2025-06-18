import { Module } from '@nestjs/common';

import { MailerPort } from './domain/repositories/mailer.port';
import { MetricsController } from './metrics/metrics.controller';
import { AwsService } from './infrastructure/services/aws.service';
import { WebsocketsService } from './websockets/websockets.service';
import { WebsocketsGateway } from './websockets/websockets.gateway';
import { ImagesService } from './infrastructure/services/images.service';
import { FileStoragePort } from './domain/repositories/file-storage.port';
import { NodemailerService } from './infrastructure/services/nodemailer.service';

@Module({
  controllers: [MetricsController],
  exports: [
    NodemailerService,
    FileStoragePort,
    ImagesService,
    WebsocketsGateway,
    WebsocketsService,
    MailerPort,
  ],
  imports: [],
  providers: [
    NodemailerService,
    AwsService,
    { provide: FileStoragePort, useClass: AwsService },
    ImagesService,
    WebsocketsGateway,
    WebsocketsService,
    { provide: MailerPort, useClass: NodemailerService },
  ],
})
export class SharedModule {}
