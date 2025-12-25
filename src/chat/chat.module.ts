import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConversationsModule } from 'src/conversations/conversations.module';

import { ChatGateway } from './chat.gateway';

@Module({
  exports: [ChatGateway],
  imports: [
    PrismaModule,
    ConversationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '1d'),
        },
      }),
    }),
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
