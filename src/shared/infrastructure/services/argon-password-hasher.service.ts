import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { PasswordHasherPort } from 'src/shared/domain/repositories/password-hasher.port';

@Injectable()
export class ArgonPasswordHasherService implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await argon2.verify(hashedPassword, password);
  }
}
