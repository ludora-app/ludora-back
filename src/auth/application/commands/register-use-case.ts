import { Inject } from '@nestjs/common';
import { S3FoldersName } from 'src/shared/domain/constants/constants';
import { TokenRepository } from 'src/auth/domain/repositories/token.repository';
import { FileStoragePort } from 'src/shared/domain/repositories/file-storage.port';
import { UserAuthRepository } from 'src/auth/domain/repositories/user-auth.repository';
import { CreateImageDto, RegisterResponseDto, RegisterUserDto } from 'src/auth/presentation/dto';

export class RegisterUserCase {
  constructor(
    @Inject(UserAuthRepository)
    private readonly userAuthRepository: UserAuthRepository,
    private readonly tokenRepo: TokenRepository,
    private readonly fileStorage: FileStoragePort,
  ) {}

  async execute(
    registerDto: RegisterUserDto,
    createImageDto: CreateImageDto,
  ): Promise<RegisterResponseDto> {
    if (createImageDto) {
      const image = await this.fileStorage.upload(
        S3FoldersName.USERS,
        createImageDto.name,
        createImageDto.file,
      );
      (registerDto as any).imageUrl = image.message;
    }
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

    await this.userAuthRepository.sendVerificationEmail(user.id, user.email);

    await this.tokenRepo.saveToken(user.id, access_token);
    return {
      data: {
        accessToken: access_token,
      },
    };
  }
}
