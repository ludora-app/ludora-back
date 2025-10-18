import { Controller, Get, UseGuards } from '@nestjs/common';

import { AppService } from './app.service';
import { Public } from './shared/decorators/public.decorator';
import { AuthB2CGuard } from './auth-b2c/guards/auth-b2c.guard';

@Controller()
@UseGuards(AuthB2CGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
