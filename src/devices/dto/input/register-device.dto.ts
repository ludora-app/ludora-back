import { ApiProperty } from '@nestjs/swagger';
import { Platform } from 'generated/prisma/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'FCM token of the device',
    example: 'cm7hvgonx0000to0mh5maqajc',
  })
  fcmToken: string;

  @IsEnum(Platform)
  @ApiProperty({
    description: 'Platform of the device',
    enum: Platform,
    example: Platform.ANDROID,
  })
  @IsNotEmpty()
  platform: Platform;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Device ID of the device',
    example: 'cm7hvgonx0000to0mh5maqajc',
  })
  deviceId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'App version of the device',
    example: '1.0.0',
  })
  appVersion?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'OS version of the device',
    example: '1.0.0',
  })
  osVersion?: string;
}
