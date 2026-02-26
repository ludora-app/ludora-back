import { Controller, Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { register } from 'prom-client';
import { Public } from 'src/shared/decorators/public.decorator';

/**
 * Custom Prometheus metrics endpoint.
 *
 * NOTE: The final route path is configured via `PrometheusModule.register({ path, controller })`
 * in `src/metrics/metrics.module.ts` to avoid Fastify duplicated-route errors.
 */
@Controller()
export class MetricsController {
  @Get()
  @Public()
  async index(@Res({ passthrough: true }) response: FastifyReply) {
    response.header('Content-Type', register.contentType);
    return register.metrics();
  }
}
