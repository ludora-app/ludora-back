import contentParser from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  // Limit to 10 Mo per file to support HEIC (iPhone) and other photos
  await app.register(contentParser, { limits: { fileSize: 10 * 1024 * 1024 } });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  // if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('Ludora API')
    .setDescription('API for the Ludora app')
    .setVersion('0.0.1')
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

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      operationsSorter: 'method',
      tagsSorter: 'alpha',
    },
  });
  // }

  // In Docker, Fastify must listen on 0.0.0.0 to be reachable from outside the container.
  const port = Number(process.env.PORT ?? 2424);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen({ host, port });
}
bootstrap();
