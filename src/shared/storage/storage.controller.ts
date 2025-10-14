import { FileInterceptor } from '@nestjs/platform-express';
import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';

import { StorageService } from './storage.service';

@Controller('aws')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.storageService.upload('users', file.originalname, file.buffer);
  }

  @Get('get-signed-url')
  async getSignedUrl(@Query('filename') filename: string) {
    return this.storageService.getSignedUrl('users', filename);
  }
}
