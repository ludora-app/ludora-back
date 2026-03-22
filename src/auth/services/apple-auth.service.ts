import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import appleSignin, { AppleIdTokenType } from 'apple-signin-auth';
import { PinoLogger } from 'nestjs-pino';
import { EncryptionService } from 'src/shared/encryption/encryption.service';
import { AppleAuthResult } from '../dto/output/apple-auth-result';

@Injectable()
export class AppleAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppleAuthService.name);
  }

  private get clientId(): string {
    return this.configService.getOrThrow('APPLE_CLIENT_ID');
  }

  private get teamId(): string {
    return this.configService.getOrThrow('APPLE_TEAM_ID');
  }

  private get keyId(): string {
    return this.configService.getOrThrow('APPLE_KEY_ID');
  }

  private get privateKey(): string {
    return this.configService.getOrThrow('APPLE_PRIVATE_KEY');
  }

  /**
   * Generates a short-lived Apple client secret JWT on every access.
   * The secret is derived from the private key, team ID, client ID, and key ID.
   * A new JWT is produced on each call since Apple client secrets expire after 6 months at most.
   */
  private get clientSecret(): string {
    return appleSignin.getClientSecret({
      clientID: this.clientId,
      teamID: this.teamId,
      privateKey: this.privateKey,
      keyIdentifier: this.keyId,
    });
  }

  /**
   * Verifies an Apple identity token (id_token) returned after a Sign in with Apple flow.
   * Validates the token signature against Apple's public keys and checks the audience claim.
   *
   * @param identityToken - The raw JWT identity token provided by the Apple SDK.
   * @returns The decoded and verified token payload.
   * @throws {UnauthorizedException} If the token is invalid, expired, or cannot be verified.
   */
  private async verifyIdentityToken(identityToken: string): Promise<AppleIdTokenType> {
    try {
      const payload = await appleSignin.verifyIdToken(identityToken, {
        audience: this.clientId,
        ignoreExpiration: false,
      });
      return payload;
    } catch (_error) {
      throw new UnauthorizedException('Invalid Apple identity token');
    }
  }

  /**
   * Exchanges an Apple authorization code for an OAuth token set and returns
   * the encrypted refresh token, ready to be persisted.
   *
   * @param authorizationCode - The one-time authorization code received from Apple after user consent.
   * @returns The encrypted Apple refresh token (via {@link EncryptionService}).
   * @throws {UnauthorizedException} If the code exchange with Apple's token endpoint fails.
   */
  private async exchangeAuthorizationCode(authorizationCode: string): Promise<string> {
    try {
      const clientSecret = this.clientSecret;

      const tokens = await appleSignin.getAuthorizationToken(authorizationCode, {
        clientID: this.clientId,
        clientSecret,
        redirectUri: '',
      });

      // On retourne le refresh_token chiffré, prêt à être stocké
      return this.encryptionService.encrypt(tokens.refresh_token);
    } catch (_error) {
      this.logger.error(`[getAuthorizationToken]: ${_error.message}`);
      throw new UnauthorizedException('Failed to exchange Apple authorization code');
    }
  }

  async processAuthCredential(dto: {
    identityToken: string;
    authorizationCode?: string;
    email?: string;
  }): Promise<AppleAuthResult> {
    const payload = await this.verifyIdentityToken(dto.identityToken);

    let encryptedRefreshToken: string | null = null;
    if (dto.authorizationCode) {
      encryptedRefreshToken = await this.exchangeAuthorizationCode(dto.authorizationCode);
    }

    return {
      appleUserId: payload.sub,
      email: dto.email ?? payload.email ?? null,
      isPrivateEmail: payload.is_private_email === 'true' || payload.is_private_email === true,
      encryptedRefreshToken,
    };
  }

  /**
   * Revokes an Apple refresh token, effectively signing the user out on Apple's side.
   * The token is first decrypted before being sent to Apple's revocation endpoint.
   *
   * @param encryptedRefreshToken - The encrypted Apple refresh token as stored in the database.
   * @throws {InternalServerErrorException} If the revocation request to Apple's endpoint fails.
   */
  async revokeToken(encryptedRefreshToken: string): Promise<void> {
    try {
      const clientSecret = appleSignin.getClientSecret({
        clientID: this.clientId,
        teamID: this.teamId,
        privateKey: this.privateKey,
        keyIdentifier: this.keyId,
      });

      const rawToken = this.encryptionService.decrypt(encryptedRefreshToken);

      await appleSignin.revokeAuthorizationToken(rawToken, {
        clientID: this.clientId,
        clientSecret,
        tokenTypeHint: 'refresh_token',
      });
    } catch (_error) {
      this.logger.error(`[revokeAuthorizationToken]: ${_error.message}`);
      throw new InternalServerErrorException('Failed to revoke Apple token');
    }
  }
}
