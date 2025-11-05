import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Histogram } from 'prom-client';
import { Request, Response } from 'express';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

/* The `HttpMetricsInterceptor` class in TypeScript is an Injectable NestInterceptor that observes and
records HTTP request durations using a specified metric. */
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private httpRequestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();
    const method = request.method;
    // Utiliser le pattern de route ou l'URL comme fallback
    const route = request.route?.path || this.normalizeRoute(request.url);
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
