import { ApiProperty } from '@nestjs/swagger';
import { Platform } from 'generated/prisma/enums';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

export class DeviceResponseData {
  @ApiProperty({ description: 'uid of the device', example: 'cm7hvgonx0000to0mh5maqajc' })
  readonly uid: string;

  @ApiProperty({ description: 'fcm token of the device', example: 'cm7hvgonx0000to0mh5maqajc' })
  readonly fcmToken: string;

  @ApiProperty({ description: 'device id of the device', example: 'cm7hvgonx0000to0mh5maqajc' })
  readonly deviceId: string;

  @ApiProperty({ description: 'app version of the device', example: '1.0.0' })
  readonly appVersion?: string;

  @ApiProperty({ description: 'os version of the device', example: '1.0.0' })
  readonly osVersion?: string;

  @ApiProperty({ description: 'platform of the device', enum: Platform, example: Platform.ANDROID })
  readonly platform: Platform;

  @ApiProperty({ description: 'is active of the device', example: true })
  readonly isActive?: boolean;

  @ApiProperty({ description: 'last seen at of the device', example: '2025-01-01T00:00:00.000Z' })
  readonly lastSeenAt?: Date;

  @ApiProperty({ description: 'created at of the device', example: '2025-01-01T00:00:00.000Z' })
  readonly createdAt?: Date;

  @ApiProperty({ description: 'updated at of the device', example: '2025-01-01T00:00:00.000Z' })
  readonly updatedAt?: Date;

  @ApiProperty({ description: 'user uid of the device', example: 'cm7hvgonx0000to0mh5maqajc' })
  readonly userUid?: string;
}

export class DeviceResponseDto extends ResponseTypeDto<DeviceResponseData> {
  @ApiProperty({ type: DeviceResponseData })
  readonly data: DeviceResponseData;
}
