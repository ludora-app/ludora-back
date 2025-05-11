import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';

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

  const jwtService = app.get(JwtService);
  const reflector = app.get(Reflector);
  const configService = app.get(ConfigService);
  // app.useGlobalGuards(new AuthGuard(jwtService, reflector, configService));
  await app.listen(process.env.PORT ?? 2424);
}
bootstrap();
