import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { BadRequestException, Injectable } from '@nestjs/common';

import { RegisterDeviceDto } from './dto/input/register-device.dto';
import { DeviceResponseData } from './dto/output/device-response.dto';

@Injectable()
export class DevicesService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DevicesService.name);
  }
  /**
   * Create or update a device
   * @param userUid
   * @param dto
   * @returns
   */
  async registerDevice(userUid: string, dto: RegisterDeviceDto): Promise<DeviceResponseData> {
    const isValid = await this.firebaseService.verifyToken(dto.fcmToken);

    if (!isValid) {
      throw new BadRequestException('Invalid FCM token');
    }

    // Upsert le device
    const device = await this.prisma.devices.upsert({
      create: {
        appVersion: dto.appVersion,
        deviceId: dto.deviceId,
        fcmToken: dto.fcmToken,
        osVersion: dto.osVersion,
        platform: dto.platform,
        userUid,
      },
      select: {
        appVersion: true,
        deviceId: true,
        fcmToken: true,
        isActive: true,
        osVersion: true,
        platform: true,
        uid: true,
      },
      update: {
        appVersion: dto.appVersion,
        deviceId: dto.deviceId,
        isActive: true,
        lastSeenAt: new Date(),
        osVersion: dto.osVersion,
        platform: dto.platform,
        userUid,
      },
      where: { fcmToken: dto.fcmToken },
    });

    this.logger.debug(`Device registered for user ${userUid}`);
    return device;
  }

  /**
   * Get all active FCM tokens for a user
   * @param userUid
   * @returns
   */
  async getUserFcmTokens(userUid: string): Promise<string[]> {
    const devices = await this.prisma.devices.findMany({
      select: {
        fcmToken: true,
      },
      where: {
        isActive: true,
        userUid,
      },
    });

    return devices.map((d) => d.fcmToken);
  }

  /**
   * Unregister a device
   * @param fcmToken
   * @returns
   */
  async unregisterDevice(fcmToken: string): Promise<void> {
    await this.prisma.devices.update({
      data: { isActive: false },
      where: { fcmToken },
    });

    this.logger.debug(`Device unregistered: ${fcmToken}`);
  }

  /**
   * Clean invalid tokens (to be executed periodically)
   */
  async cleanInvalidTokens() {
    const devices = await this.prisma.devices.findMany({
      where: { isActive: true },
    });

    let invalidCount = 0;

    for (const device of devices) {
      const isValid = await this.firebaseService.verifyToken(device.fcmToken);

      if (!isValid) {
        await this.prisma.devices.update({
          data: { isActive: false },
          where: { uid: device.uid },
        });
        invalidCount++;
      }
    }

    this.logger.debug(`Cleaned ${invalidCount} invalid tokens`);
    return { invalidCount };
  }
}
