import { Controller, Get, Res } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('metrics')
export class MetricsController extends PrometheusController {
  @Get()
  @Public()
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
