import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from '../../../src/shared/encryption/encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  // 32 bytes key in hex (64 chars)
  const mockKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'ENCRYPTION_KEY') return mockKey;
              throw new Error(`Unexpected key: ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and then decrypt back to the original value', () => {
      const originalValue = 'hello-world';
      const encryptedValue = service.encrypt(originalValue);

      expect(encryptedValue).toBeDefined();
      expect(typeof encryptedValue).toBe('string');
      expect(encryptedValue).not.toBe(originalValue);

      const decryptedValue = service.decrypt(encryptedValue);
      expect(decryptedValue).toBe(originalValue);
    });

    it('should produce different encrypted strings for the same input due to random IV', () => {
      const value = 'test-value';
      const encrypted1 = service.encrypt(value);
      const encrypted2 = service.encrypt(value);

      expect(encrypted1).not.toBe(encrypted2);
      expect(service.decrypt(encrypted1)).toBe(value);
      expect(service.decrypt(encrypted2)).toBe(value);
    });

    it('should throw an error if trying to decrypt invalid base64', () => {
      expect(() => service.decrypt('not-base64-!@#')).toThrow();
    });

    it('should throw an error if authentication fails (tampered data)', () => {
      const originalValue = 'sensitive-data';
      const encryptedValue = service.encrypt(originalValue);

      // Tamper with the encrypted data part (after IV and AuthTag)
      const buffer = Buffer.from(encryptedValue, 'base64');
      buffer[buffer.length - 1] ^= 1; // Flip a bit
      const tamperedValue = buffer.toString('base64');

      expect(() => service.decrypt(tamperedValue)).toThrow();
    });
  });

  describe('generateToken', () => {
    it('should generate a token of the requested length in hex', () => {
      const length = 16;
      const token = service.generateToken(length);

      // hex string: 2 characters per byte
      expect(token).toHaveLength(length * 2);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should use default length of 32 if none provided', () => {
      const token = service.generateToken();
      expect(token).toHaveLength(64);
    });
  });
});
