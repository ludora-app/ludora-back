import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import appleSignin from 'apple-signin-auth';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppleAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppleAuthService.name);
  }

  // private readonly clientSecret = appleSignin.getClientSecret({
  //   clientID: this.configService.getOrThrow('APPLE_CLIENT_ID'),
  //   teamID: this.configService.getOrThrow('APPLE_TEAM_ID'),
  //   privateKey: this.configService.getOrThrow('APPLE_PRIVATE_KEY'),
  //   keyIdentifier: this.configService.getOrThrow('APPLE_KEY_IDENTIFIER'),
  // });

  // private readonly options = {
  //   clientID: 'com.company.app',
  //   redirectUri: 'http://localhost:3000/auth/apple/callback',
  //   clientSecret: this.clientSecret,
  // };
}
