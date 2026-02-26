import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AuthB2CGuard } from 'src/auth/guards/auth-b2c.guard';
import { Protected } from 'src/shared/decorators/protected.decorator';
import { BadRequestResponseDto } from 'src/shared/dto/errors/bad-request-response.dto';
import { UnauthorizedResponseDto } from 'src/shared/dto/errors/unauthorized-response.dto';
import { ResponseTypeDto } from 'src/shared/dto/responses/response-type';

import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/input/register-device.dto';
import { UnregisterDeviceDto } from './dto/input/unregister-device.dto';
import { DeviceResponseData, DeviceResponseDto } from './dto/output/device-response.dto';

@UseGuards(AuthB2CGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @Protected()
  @ApiOperation({ summary: 'Register a new device' })
  @ApiCreatedResponse({ type: DeviceResponseDto })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  async registerDevice(
    @Body() registerDeviceDto: RegisterDeviceDto,
    @Req() req: FastifyRequest,
  ): Promise<ResponseTypeDto<DeviceResponseData>> {
    const userUid = req['user'].uid;
    const device = await this.devicesService.registerDevice(userUid, registerDeviceDto);
    return {
      data: device,
      message: 'Device registered successfully',
    };
  }

  @Delete('unregister')
  @Protected()
  @ApiOperation({ summary: 'Unregister a device, used when logging out are deleting the account' })
  @ApiBody({ type: UnregisterDeviceDto })
  @ApiNoContentResponse({ description: 'Device unregistered successfully' })
  @ApiBadRequestResponse({ type: BadRequestResponseDto })
  @ApiUnauthorizedResponse({ type: UnauthorizedResponseDto })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregister(@Body() unregisterDeviceDto: UnregisterDeviceDto): Promise<void> {
    return await this.devicesService.unregisterDevice(unregisterDeviceDto.fcmToken);
  }
}
