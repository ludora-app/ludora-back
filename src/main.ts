import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Ludora API')
      .setDescription('API for the Ludora app')
      .setVersion('0.0.1')
      .addBearerAuth(
        {
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
          name: 'Authorization',
          scheme: 'bearer',
          type: 'http',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('swagger', app, document);
  }
  await app.listen(process.env.PORT ?? 2424);
}
bootstrap();
