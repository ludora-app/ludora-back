import { PickType } from '@nestjs/swagger';

import { RegisterDeviceDto } from './register-device.dto';

export class UnregisterDeviceDto extends PickType(RegisterDeviceDto, ['fcmToken']) {}
