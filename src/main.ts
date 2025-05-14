import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
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

  const config = new DocumentBuilder()
    .setTitle('Ludora API')
    .setDescription('API for the Ludora app')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const jwtService = app.get(JwtService);
  const reflector = app.get(Reflector);
  const configService = app.get(ConfigService);
  app.useGlobalInterceptors();

  // app.useGlobalGuards(new AuthGuard(jwtService, reflector, configService));
  await app.listen(process.env.PORT ?? 2424);
}
bootstrap();
