import { Controller, Get, Post, Query, Req } from '@nestjs/common';

import { StorageService } from './storage.service';
import { Protected } from '../decorators/protected.decorator';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Protected()
  async upload(@Req() request: any) {
    // Handle multipart form data with Fastify
    const data = await request.file();

    if (!data) {
      throw new Error('No file uploaded');
    }

    const fileBuffer = await data.toBuffer();
    const filename = data.filename;

    return this.storageService.upload('users', filename, fileBuffer);
  }

  @Get('get-signed-url')
  @Protected()
  async getSignedUrl(@Query('filename') filename: string) {
    return this.storageService.getSignedUrl('users', filename);
  }
}
