import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from 'src/devices/devices.controller';
import { DevicesService } from 'src/devices/devices.service';

describe('DevicesController', () => {
  let controller: DevicesController;

  const mockDevicesService = {
    registerDevice: jest.fn(),
    unregisterDevice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [
        {
          provide: DevicesService,
          useValue: mockDevicesService,
        },
      ],
    })
      .overrideGuard(require('src/auth/guards/auth-b2c.guard').AuthB2CGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DevicesController>(DevicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
