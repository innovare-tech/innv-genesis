import { Logger, Provider } from '@nestjs/common';
import { METRICS_HTTP_HISTOGRAM, METRICS_REGISTRY } from './metrics.tokens';
import { tryRequire } from '../../utils/tryRequire';

const logger = new Logger('metrics.providers');

export const metricsProviders: Provider[] = [
  {
    provide: METRICS_REGISTRY,
    useFactory: () => {
      const prom = tryRequire<typeof import('prom-client')>('prom-client');
      if (!prom) {
        logger.warn(
          '[nest-initializer] prom-client não encontrado — métricas desabilitadas (Registry no-op).',
        );
        return {
          registerMetric: () => {},
          // eslint-disable-next-line @typescript-eslint/require-await
          metrics: async () => '',
          contentType: 'text/plain; version=0.0.4; charset=utf-8',
        } as any;
      }

      const { Registry, collectDefaultMetrics } = prom;
      const registry = new Registry();
      collectDefaultMetrics({ register: registry });
      return registry;
    },
  },
  {
    provide: METRICS_HTTP_HISTOGRAM,
    useFactory: (registry: any) => {
      const prom = tryRequire<typeof import('prom-client')>('prom-client');
      if (!prom) {
        // no-op histogram
        return {
          startTimer: () => () => {},
        } as any;
      }

      const { Histogram } = prom;
      const histogram = new Histogram({
        name: 'http_requests_duration_seconds',
        help: 'Duração das requisições HTTP em segundos',
        labelNames: ['method', 'path', 'status_code'],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10],
      });
      registry.registerMetric(histogram);
      return histogram;
    },
    inject: [METRICS_REGISTRY],
  },
];
