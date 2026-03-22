import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import appleSignin from 'apple-signin-auth';
import { PinoLogger } from 'nestjs-pino';
import { AppleAuthService } from 'src/auth/services/apple-auth.service';
import { EncryptionService } from 'src/shared/encryption/encryption.service';

// ---------------------------------------------------------------------------
// Mock the entire apple-signin-auth module
// ---------------------------------------------------------------------------
jest.mock('apple-signin-auth', () => ({
  __esModule: true,
  default: {
    getClientSecret: jest.fn(),
    verifyIdToken: jest.fn(),
    getAuthorizationToken: jest.fn(),
    revokeAuthorizationToken: jest.fn(),
  },
}));

const mockAppleSignin = appleSignin as jest.Mocked<typeof appleSignin>;

// ---------------------------------------------------------------------------
// Mock data factories
// apple-signin-auth types have strict shapes (exp/iat as string, literal
// 'Bearer'), so we return `any` to keep the test fixtures simple and resilient.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeApplePayload = (overrides: Record<string, any> = {}): any => ({
  sub: 'apple-user-id-001',
  email: 'user@privaterelay.appleid.com',
  is_private_email: 'true',
  email_verified: 'true',
  iss: 'https://appleid.apple.com',
  aud: 'com.example.app',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  nonce: 'mock-nonce',
  nonce_supported: true,
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeAppleTokens = (overrides: Record<string, any> = {}): any => ({
  access_token: 'apple-access-token',
  refresh_token: 'apple-raw-refresh-token',
  id_token: 'apple-id-token',
  token_type: 'Bearer',
  expires_in: 3600,
  ...overrides,
});

const MOCK_CLIENT_SECRET = 'mock-client-secret-jwt';

// ---------------------------------------------------------------------------
describe('AppleAuthService', () => {
  let service: AppleAuthService;

  // ---------------------------------------------------------------------------
  // Mocks
  // ---------------------------------------------------------------------------
  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        APPLE_CLIENT_ID: 'com.example.app',
        APPLE_TEAM_ID: 'TEAM123',
        APPLE_KEY_ID: 'KEY456',
        APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
      };
      if (key in config) return config[key];
      throw new Error(`Missing env var: ${key}`);
    }),
  };

  const mockEncryptionService = {
    encrypt: jest.fn((value: string) => `encrypted:${value}`),
    decrypt: jest.fn((value: string) => value.replace('encrypted:', '')),
  };

  const mockPinoLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };

  // ---------------------------------------------------------------------------
  // Module setup
  // ---------------------------------------------------------------------------
  beforeEach(async () => {
    mockAppleSignin.getClientSecret.mockReturnValue(MOCK_CLIENT_SECRET);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppleAuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<AppleAuthService>(AppleAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // processAuthCredential
  // ---------------------------------------------------------------------------
  describe('processAuthCredential', () => {
    describe('identity token verification', () => {
      it('should verify the identity token against the configured clientId', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());

        await service.processAuthCredential({ identityToken: 'valid-identity-token' });

        expect(mockAppleSignin.verifyIdToken).toHaveBeenCalledWith('valid-identity-token', {
          audience: 'com.example.app',
          ignoreExpiration: false,
        });
      });

      it('should return the appleUserId from the payload sub claim', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());

        const result = await service.processAuthCredential({ identityToken: 'valid-identity-token' });

        expect(result.appleUserId).toBe('apple-user-id-001');
      });

      it('should throw UnauthorizedException when verifyIdToken rejects', async () => {
        mockAppleSignin.verifyIdToken.mockRejectedValue(new Error('Token expired'));

        await expect(
          service.processAuthCredential({ identityToken: 'expired-token' }),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException with the expected message', async () => {
        mockAppleSignin.verifyIdToken.mockRejectedValue(new Error('Bad signature'));

        await expect(
          service.processAuthCredential({ identityToken: 'bad-token' }),
        ).rejects.toThrow('Invalid Apple identity token');
      });
    });

    describe('email resolution', () => {
      it('should prefer dto.email over the payload email when both are present', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload({ email: 'payload@apple.com' }));

        const result = await service.processAuthCredential({
          identityToken: 'valid-token',
          email: 'override@example.com',
        });

        expect(result.email).toBe('override@example.com');
      });

      it('should fall back to payload.email when dto.email is absent', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload({ email: 'payload@apple.com' }));

        const result = await service.processAuthCredential({ identityToken: 'valid-token' });

        expect(result.email).toBe('payload@apple.com');
      });

      it('should set email to null when neither dto.email nor payload.email is defined', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload({ email: undefined }));

        const result = await service.processAuthCredential({ identityToken: 'valid-token' });

        expect(result.email).toBeNull();
      });
    });

    describe('isPrivateEmail flag', () => {
      it('should set isPrivateEmail=true when payload returns string "true"', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload({ is_private_email: 'true' }));

        const result = await service.processAuthCredential({ identityToken: 'valid-token' });

        expect(result.isPrivateEmail).toBe(true);
      });

      it('should set isPrivateEmail=true when payload returns boolean true', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload({ is_private_email: true }));

        const result = await service.processAuthCredential({ identityToken: 'valid-token' });

        expect(result.isPrivateEmail).toBe(true);
      });

      it('should set isPrivateEmail=false when payload returns string "false"', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload({ is_private_email: 'false' }));

        const result = await service.processAuthCredential({ identityToken: 'valid-token' });

        expect(result.isPrivateEmail).toBe(false);
      });

      it('should set isPrivateEmail=false when payload returns boolean false', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload({ is_private_email: false }));

        const result = await service.processAuthCredential({ identityToken: 'valid-token' });

        expect(result.isPrivateEmail).toBe(false);
      });
    });

    describe('authorization code exchange', () => {
      it('should not call getAuthorizationToken when authorizationCode is absent', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());

        await service.processAuthCredential({ identityToken: 'valid-token' });

        expect(mockAppleSignin.getAuthorizationToken).not.toHaveBeenCalled();
      });

      it('should return null encryptedRefreshToken when authorizationCode is absent', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());

        const result = await service.processAuthCredential({ identityToken: 'valid-token' });

        expect(result.encryptedRefreshToken).toBeNull();
      });

      it('should exchange the authorization code with the correct options', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());
        mockAppleSignin.getAuthorizationToken.mockResolvedValue(makeAppleTokens());

        await service.processAuthCredential({
          identityToken: 'valid-token',
          authorizationCode: 'one-time-auth-code',
        });

        expect(mockAppleSignin.getAuthorizationToken).toHaveBeenCalledWith('one-time-auth-code', {
          clientID: 'com.example.app',
          clientSecret: MOCK_CLIENT_SECRET,
          redirectUri: '',
        });
      });

      it('should encrypt the refresh_token returned by Apple', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());
        mockAppleSignin.getAuthorizationToken.mockResolvedValue(
          makeAppleTokens({ refresh_token: 'apple-raw-refresh-token' }),
        );

        await service.processAuthCredential({
          identityToken: 'valid-token',
          authorizationCode: 'one-time-auth-code',
        });

        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('apple-raw-refresh-token');
      });

      it('should return the encrypted refresh token in the result', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());
        mockAppleSignin.getAuthorizationToken.mockResolvedValue(makeAppleTokens());

        const result = await service.processAuthCredential({
          identityToken: 'valid-token',
          authorizationCode: 'one-time-auth-code',
        });

        expect(result.encryptedRefreshToken).toBe('encrypted:apple-raw-refresh-token');
      });

      it('should throw UnauthorizedException when getAuthorizationToken fails', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());
        mockAppleSignin.getAuthorizationToken.mockRejectedValue(new Error('Network error'));

        await expect(
          service.processAuthCredential({
            identityToken: 'valid-token',
            authorizationCode: 'bad-code',
          }),
        ).rejects.toThrow(UnauthorizedException);

        await expect(
          service.processAuthCredential({
            identityToken: 'valid-token',
            authorizationCode: 'bad-code',
          }),
        ).rejects.toThrow('Failed to exchange Apple authorization code');
      });

      it('should log the error when getAuthorizationToken fails', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());
        mockAppleSignin.getAuthorizationToken.mockRejectedValue(new Error('Upstream error'));

        await expect(
          service.processAuthCredential({
            identityToken: 'valid-token',
            authorizationCode: 'bad-code',
          }),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockPinoLogger.error).toHaveBeenCalledWith(
          '[getAuthorizationToken]: Upstream error',
        );
      });
    });

    describe('full flow', () => {
      it('should return the complete AppleAuthResult', async () => {
        mockAppleSignin.verifyIdToken.mockResolvedValue(makeApplePayload());
        mockAppleSignin.getAuthorizationToken.mockResolvedValue(makeAppleTokens());

        const result = await service.processAuthCredential({
          identityToken: 'valid-token',
          authorizationCode: 'one-time-auth-code',
          email: 'user@example.com',
        });

        expect(result).toEqual({
          appleUserId: 'apple-user-id-001',
          email: 'user@example.com',
          isPrivateEmail: true,
          encryptedRefreshToken: 'encrypted:apple-raw-refresh-token',
        });
      });
    });
  });

  // ---------------------------------------------------------------------------
  // revokeToken
  // ---------------------------------------------------------------------------
  describe('revokeToken', () => {
    it('should decrypt the token before sending it to Apple', async () => {
      mockAppleSignin.revokeAuthorizationToken.mockResolvedValue(undefined);

      await service.revokeToken('encrypted:apple-raw-refresh-token');

      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted:apple-raw-refresh-token');
    });

    it('should call revokeAuthorizationToken with the decrypted token and correct options', async () => {
      mockAppleSignin.revokeAuthorizationToken.mockResolvedValue(undefined);

      await service.revokeToken('encrypted:apple-raw-refresh-token');

      expect(mockAppleSignin.revokeAuthorizationToken).toHaveBeenCalledWith(
        'apple-raw-refresh-token',
        {
          clientID: 'com.example.app',
          clientSecret: MOCK_CLIENT_SECRET,
          tokenTypeHint: 'refresh_token',
        },
      );
    });

    it('should resolve without returning a value on success', async () => {
      mockAppleSignin.revokeAuthorizationToken.mockResolvedValue(undefined);

      await expect(service.revokeToken('encrypted:token')).resolves.toBeUndefined();
    });

    it('should throw InternalServerErrorException when revocation fails', async () => {
      mockAppleSignin.revokeAuthorizationToken.mockRejectedValue(new Error('Apple API down'));

      await expect(service.revokeToken('encrypted:token')).rejects.toThrow(
        InternalServerErrorException,
      );

      await expect(service.revokeToken('encrypted:token')).rejects.toThrow(
        'Failed to revoke Apple token',
      );
    });

    it('should log the error when revocation fails', async () => {
      mockAppleSignin.revokeAuthorizationToken.mockRejectedValue(new Error('Timeout'));

      await expect(service.revokeToken('encrypted:token')).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockPinoLogger.error).toHaveBeenCalledWith(
        '[revokeAuthorizationToken]: Timeout',
      );
    });

    it('should generate a fresh clientSecret on each revokeToken call', async () => {
      mockAppleSignin.revokeAuthorizationToken.mockResolvedValue(undefined);

      await service.revokeToken('encrypted:token-a');
      await service.revokeToken('encrypted:token-b');

      // getClientSecret is called once per revokeToken invocation (lazy getter)
      expect(mockAppleSignin.getClientSecret).toHaveBeenCalledTimes(2);
    });
  });
});
