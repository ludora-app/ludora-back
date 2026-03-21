import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12; //* standard length for AES-GCM
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.getOrThrow<string>('ENCRYPTION_KEY');
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(value: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decrypt(encryptedValue: string): string {
    const buffer = Buffer.from(encryptedValue, 'base64');

    const iv = buffer.subarray(0, this.ivLength);
    const authTag = buffer.subarray(this.ivLength, this.ivLength + 16);
    const encrypted = buffer.subarray(this.ivLength + 16);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
