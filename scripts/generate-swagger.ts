import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';

async function generateSwagger() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: false,
  });

  const config = new DocumentBuilder()
    .setTitle('Ludora API')
    .setDescription('API for the Ludora app')
    .setVersion(process.env.npm_package_version ?? '0.0.1')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        scheme: 'bearer',
        type: 'http',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('swagger.json', JSON.stringify(document, null, 2));

  await app.close();
  console.log('swagger.json generated successfully');
}

generateSwagger().catch((err) => {
  console.error('Failed to generate swagger.json:', err);
  process.exit(1);
});
