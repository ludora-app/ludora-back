import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/* The `HttpMetricsInterceptor` class in TypeScript is an Injectable NestInterceptor that observes and
records HTTP request durations using a specified metric. */
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private httpRequestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();

    const startTime = Date.now();
    const method = request.method;
    // Utiliser le pattern de route ou l'URL comme fallback
    const route = (request.routeOptions?.url as string) || this.normalizeRoute(request.url);
    const statusCode = response.statusCode;

    return next.handle().pipe(
      tap({
        error: () => {
          const duration = (Date.now() - startTime) / 1000;
          this.httpRequestDuration.observe(
            {
              method,
              route,
              status_code: response.statusCode?.toString() || '500',
            },
            duration,
          );
        },
        next: () => {
          const duration = (Date.now() - startTime) / 1000; // Convert to seconds
          this.httpRequestDuration.observe(
            {
              method,
              route,
              status_code: statusCode.toString(),
            },
            duration,
          );
        },
      }),
    );
  }

  private normalizeRoute(url: string): string {
    // Normalise les routes dynamiques (ex: /users/123 -> /users/:id)
    return url.split('?')[0]; // Enlève les query params
  }
}
