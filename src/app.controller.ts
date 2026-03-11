import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';
import { AuthB2CGuard } from './auth/guards/auth-b2c.guard';
import { Public } from './shared/decorators/public.decorator';
import { SWAGGER_TAG_APP } from './swagger.config';

@ApiTags(SWAGGER_TAG_APP)
@Controller()
@UseGuards(AuthB2CGuard)
@ApiBearerAuth('JWT-auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @ApiOperation({ summary: 'Get the health of the application' })
  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
