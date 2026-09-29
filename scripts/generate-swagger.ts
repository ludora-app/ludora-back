import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../src/app.module';
import {
  buildSwaggerDocuments,
  SWAGGER_FILE_ADMIN,
  SWAGGER_FILE_LEGACY,
  SWAGGER_FILE_PUBLIC,
} from '../src/swagger/swagger.config';

async function generateSwagger() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: false,
  });

  const documents = buildSwaggerDocuments(app);
  const files = {
    [SWAGGER_FILE_ADMIN]: documents.admin,
    [SWAGGER_FILE_PUBLIC]: documents.public,
    // Deprecated: kept for existing consumers of swagger.json
    [SWAGGER_FILE_LEGACY]: documents.admin,
  };

  for (const [file, document] of Object.entries(files)) {
    writeFileSync(file, JSON.stringify(document, null, 2));
  }

  await app.close();
  console.log(`Swagger specs generated successfully: ${Object.keys(files).join(', ')}`);
}

generateSwagger().catch((err) => {
  console.error('Failed to generate swagger specs:', err);
  process.exit(1);
});
