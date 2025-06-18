import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { SharedModule } from 'src/shared/shared.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { UsersService } from 'src/users/application/services/users.service';
import { TokenRepository } from 'src/auth/domain/repositories/token.repository';
import { UserAuthRepository } from 'src/auth/domain/repositories/user-auth.repository';
import { ArgonPasswordHasherService } from 'src/shared/infrastructure/services/argon-password-hasher.service';

import { AuthService } from './auth.service';
import { AuthController } from './presentation/auth.controller';
import { LoginUseCase } from './application/commands/login-use-case';
import { TokenAdapter } from './infrastructure/adapters/token.adapter';
import { RegisterUserCase } from './application/commands/register-use-case';
import { UserAuthAdapter } from './infrastructure/adapters/user-auth.adapter';
import { PrismaAuthAdapter } from './infrastructure/adapters/prisma-auth.adapter';
import { ValidateEmailUseCase } from './application/commands/validate-email-use-case';
import { EmailVerificationRepository } from './domain/repositories/email-verification.repository';

@Module({
  controllers: [AuthController],
  exports: [AuthService],
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      // signOptions: { expiresIn: '60s' },
    }),
    UsersModule,
    SharedModule,
    PrometheusModule.register({
      defaultMetrics: {
        enabled: false,
      },
    }),
  ],
  providers: [
    AuthService,
    LoginUseCase,
    RegisterUserCase,
    ValidateEmailUseCase,
    {
      provide: UserAuthRepository,
      useClass: UserAuthAdapter,
    },
    ArgonPasswordHasherService,
    UsersService,
    {
      provide: TokenRepository,
      useClass: TokenAdapter,
    },
    {
      provide: EmailVerificationRepository,
      useClass: PrismaAuthAdapter,
    },
  ],
})
export class AuthModule {}
