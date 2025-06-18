import { NotFoundException, Inject } from '@nestjs/common';
import { LoginCredentials } from 'src/auth/domain/entities/login-credentials';
import { TokenRepository } from 'src/auth/domain/repositories/token.repository';
import { UserAuthRepository } from 'src/auth/domain/repositories/user-auth.repository';

export class LoginUseCase {
  constructor(
    @Inject(UserAuthRepository)
    private readonly userAuthRepository: UserAuthRepository,
    private readonly tokenRepo: TokenRepository,
  ) {}

  async execute(email: string, password: string, deviceId?: string): Promise<string> {
    const user = await this.userAuthRepository.validateUser(
      LoginCredentials.create(email, password, deviceId),
    );
    if (!user) throw new NotFoundException('User not found');

    const payload = { id: user.id, ...(deviceId && { deviceId }) };
    const access_token = this.tokenRepo.sign(payload);

    const tokens = await this.tokenRepo.getTokensForUser(user.id);
    const tokenWithDeviceId = tokens.find((t) => t.deviceId);
    const tokensWithoutDeviceId = tokens.filter((t) => !t.deviceId);

    if (deviceId) {
      if (tokenWithDeviceId) {
        await this.tokenRepo.deleteTokenById(tokenWithDeviceId.id);
      } else {
        await this.tokenRepo.saveToken(user.id, access_token, deviceId);
      }
    } else {
      if (tokensWithoutDeviceId.length >= 1) {
        await this.tokenRepo.deleteTokenById(tokensWithoutDeviceId[0].id);
      }
      await this.tokenRepo.saveToken(user.id, access_token);
    }

    return access_token;
  }
}
