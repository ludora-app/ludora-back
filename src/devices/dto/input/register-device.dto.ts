import { Platform } from 'generated/prisma/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsEnum(Platform)
  platform: Platform;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsOptional()
  appVersion?: string;

  @IsString()
  @IsOptional()
  osVersion?: string;
}
