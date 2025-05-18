import { Module } from '@nestjs/common';

import { AwsService } from './aws/aws.service';
import { EmailsService } from './emails/emails.service';
import { ImagesService } from './images/images.service';
import { EmailsController } from './emails/emails.controller';
import { WebsocketsService } from './websockets/websockets.service';
import { WebsocketsGateway } from './websockets/websockets.gateway';

@Module({
  controllers: [EmailsController],
  exports: [EmailsService, AwsService, ImagesService, WebsocketsGateway, WebsocketsService],
  imports: [],
  providers: [EmailsService, AwsService, ImagesService, WebsocketsGateway, WebsocketsService],
})
export class SharedModule {}
