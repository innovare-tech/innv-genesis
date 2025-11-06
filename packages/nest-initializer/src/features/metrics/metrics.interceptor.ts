import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { METRICS_HTTP_HISTOGRAM } from './metrics.tokens';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @Inject(METRICS_HTTP_HISTOGRAM) private readonly histogram: any,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const endTimer =
      this.histogram && this.histogram.startTimer
        ? this.histogram.startTimer()
        : () => () => {};

    return next.handle().pipe(
      finalize(() => {
        const path = request.route?.path ?? request.path;
        try {
          endTimer({
            method: request.method,
            path: path,
            status_code: response?.statusCode ?? 200,
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          // swallow any metric errors
        }
      }),
    );
  }
}
