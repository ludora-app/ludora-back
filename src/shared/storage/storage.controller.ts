import { Controller, Get, Post, Query, Req, UseInterceptors } from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { SWAGGER_TAG_STORAGE } from 'src/swagger.config';
import { Public } from '../decorators/public.decorator';
import { FastifyFilesInterceptor } from '../interceptors/fastify-file.interceptor';
import { StorageService } from './storage.service';

@ApiTags(SWAGGER_TAG_STORAGE)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Public()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(new FastifyFilesInterceptor('file'))
  async upload(@Req() request: FastifyRequest) {
    // Handle multipart form data with Fastify
    const files = (request as any).incomingFiles;

    return this.storageService.upload('users', files[0].originalname, files[0].buffer);
  }

  @Get()
  @Public()
  async getSignedUrl(@Query('filename') filename: string) {
    return this.storageService.getSignedUrl('users', filename);
  }
}
