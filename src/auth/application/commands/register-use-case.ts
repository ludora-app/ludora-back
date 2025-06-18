import { Inject } from '@nestjs/common';
import { TokenRepository } from 'src/auth/domain/repositories/token.repository';
import { RegisterResponseDto, RegisterUserDto } from 'src/auth/presentation/dto';
import { UserAuthRepository } from 'src/auth/domain/repositories/user-auth.repository';

export class RegisterUserCase {
  constructor(
    @Inject(UserAuthRepository)
    private readonly userAuthRepository: UserAuthRepository,
    private readonly tokenRepo: TokenRepository,
  ) {}

  async execute(registerDto: RegisterUserDto): Promise<RegisterResponseDto> {
    const user = await this.userAuthRepository.registerUser(registerDto);
    const payload = {
      id: user.id,
      ...(registerDto.deviceId && { deviceId: registerDto.deviceId }),
    };
    const access_token = this.tokenRepo.sign(payload);

    const tokens = await this.tokenRepo.getTokensForUser(user.id);
    const tokenWithDeviceId = tokens.find((t) => t.deviceId);
    const tokensWithoutDeviceId = tokens.filter((t) => !t.deviceId);

    if (tokensWithoutDeviceId.length >= 1) {
      await this.tokenRepo.deleteTokenById(tokensWithoutDeviceId[0].id);
    }
    await this.tokenRepo.saveToken(user.id, access_token);
    return {
      data: {
        accessToken: access_token,
      },
    };
  }

  //   private async saveToken(user: UserAuthInfo, access_token: string) {
  //     const payload = {
  //       id: user.id,
  //       ...(registerDto.deviceId && { deviceId: registerDto.deviceId }),
  //     };
  //     const access_token = this.tokenRepo.sign(payload);
  //   }
}
