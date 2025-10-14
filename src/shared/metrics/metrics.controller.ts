import { Controller, Get, Res } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

@Controller('metrics')
export class MetricsController extends PrometheusController {
  @Get()
  @Public()
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
