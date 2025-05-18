import { FileInterceptor } from '@nestjs/platform-express';
import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';

import { AwsService } from './aws.service';

@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.awsService.upload('users', file.originalname, file.buffer);
  }

  @Get('get-signed-url')
  async getSignedUrl(@Query('filename') filename: string) {
    return this.awsService.getSignedUrl('users', filename);
  }
}
