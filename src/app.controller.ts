import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
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
  @ApiExcludeEndpoint()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Get the health of the application' })
  @Get('health')
  getHealth(@Req() req: FastifyRequest): { status: string; timestamp: string } {
    console.log(req.headers);
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @ApiExcludeEndpoint()
  @Get('download-app')
  @ApiOperation({
    summary: 'Magic link that redirects to the right app store depending on the device',
  })
  downloadApp(@Res() res: FastifyReply, @Req() req: FastifyRequest): void {
    const ua = req.headers['user-agent'] || '';
    if (/iPhone|iPad|iPod/i.test(ua)) {
      res.redirect('https://apps.apple.com/fr/app/ludora-sport-r%C3%A9servation/id6759791424');
    } else if (/Android/i.test(ua)) {
      res.redirect(
        'https://play.google.com/store/apps/details?id=com.ludora&pcampaignid=web_share',
      );
    } else {
      res.redirect('https://www.ludora.fr');
    }
  }
}
