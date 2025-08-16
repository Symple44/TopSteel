import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';

@Injectable()
export class PrometheusConfig {
  private readonly register = register;

  // HTTP metrics
  public readonly httpRequestDuration: Histogram<string>;
  public readonly httpRequestTotal: Counter<string>;
  public readonly httpRequestErrors: Counter<string>;

  // Business metrics
  public readonly ordersTotal: Counter<string>;
  public readonly ordersValue: Summary<string>;
  public readonly paymentsTotal: Counter<string>;
  public readonly paymentsValue: Summary<string>;
  public readonly refundsTotal: Counter<string>;
  public readonly cartAbandoned: Counter<string>;
  public readonly productsViewed: Counter<string>;
  public readonly searchQueries: Counter<string>;

  // System metrics
  public readonly activeUsers: Gauge<string>;
  public readonly activeSessions: Gauge<string>;
  public readonly databaseConnections: Gauge<string>;
  public readonly cacheHitRate: Gauge<string>;
  public readonly queueSize: Gauge<string>;
  public readonly queueProcessingTime: Histogram<string>;

  // Performance metrics
  public readonly apiLatency: Histogram<string>;
  public readonly databaseLatency: Histogram<string>;
  public readonly cacheLatency: Histogram<string>;
  public readonly externalApiLatency: Histogram<string>;

  constructor() {
    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({
      register: this.register,
      prefix: 'marketplace_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    // HTTP Metrics
    this.httpRequestDuration = new Histogram({
      name: 'marketplace_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'tenant_id'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new Counter({
      name: 'marketplace_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'tenant_id'],
      registers: [this.register],
    });

    this.httpRequestErrors = new Counter({
      name: 'marketplace_http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type', 'tenant_id'],
      registers: [this.register],
    });

    // Business Metrics
    this.ordersTotal = new Counter({
      name: 'marketplace_orders_total',
      help: 'Total number of orders created',
      labelNames: ['status', 'payment_method', 'tenant_id'],
      registers: [this.register],
    });

    this.ordersValue = new Summary({
      name: 'marketplace_orders_value_euros',
      help: 'Order values in euros',
      labelNames: ['tenant_id'],
      percentiles: [0.5, 0.9, 0.95, 0.99],
      maxAgeSeconds: 600,
      ageBuckets: 5,
      registers: [this.register],
    });

    this.paymentsTotal = new Counter({
      name: 'marketplace_payments_total',
      help: 'Total number of payments processed',
      labelNames: ['status', 'method', 'tenant_id'],
      registers: [this.register],
    });

    this.paymentsValue = new Summary({
      name: 'marketplace_payments_value_euros',
      help: 'Payment values in euros',
      labelNames: ['status', 'method', 'tenant_id'],
      percentiles: [0.5, 0.9, 0.95, 0.99],
      registers: [this.register],
    });

    this.refundsTotal = new Counter({
      name: 'marketplace_refunds_total',
      help: 'Total number of refunds processed',
      labelNames: ['reason', 'tenant_id'],
      registers: [this.register],
    });

    this.cartAbandoned = new Counter({
      name: 'marketplace_cart_abandoned_total',
      help: 'Total number of abandoned carts',
      labelNames: ['tenant_id'],
      registers: [this.register],
    });

    this.productsViewed = new Counter({
      name: 'marketplace_products_viewed_total',
      help: 'Total number of product views',
      labelNames: ['category', 'tenant_id'],
      registers: [this.register],
    });

    this.searchQueries = new Counter({
      name: 'marketplace_search_queries_total',
      help: 'Total number of search queries',
      labelNames: ['results_found', 'tenant_id'],
      registers: [this.register],
    });

    // System Metrics
    this.activeUsers = new Gauge({
      name: 'marketplace_active_users',
      help: 'Number of active users',
      labelNames: ['tenant_id'],
      registers: [this.register],
    });

    this.activeSessions = new Gauge({
      name: 'marketplace_active_sessions',
      help: 'Number of active sessions',
      labelNames: ['tenant_id'],
      registers: [this.register],
    });

    this.databaseConnections = new Gauge({
      name: 'marketplace_database_connections',
      help: 'Number of active database connections',
      labelNames: ['pool_name'],
      registers: [this.register],
    });

    this.cacheHitRate = new Gauge({
      name: 'marketplace_cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['cache_type'],
      registers: [this.register],
    });

    this.queueSize = new Gauge({
      name: 'marketplace_queue_size',
      help: 'Number of jobs in queue',
      labelNames: ['queue_name', 'status'],
      registers: [this.register],
    });

    this.queueProcessingTime = new Histogram({
      name: 'marketplace_queue_processing_time_seconds',
      help: 'Queue job processing time in seconds',
      labelNames: ['queue_name', 'job_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
      registers: [this.register],
    });

    // Performance Metrics
    this.apiLatency = new Histogram({
      name: 'marketplace_api_latency_seconds',
      help: 'API endpoint latency in seconds',
      labelNames: ['endpoint', 'method', 'tenant_id'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.register],
    });

    this.databaseLatency = new Histogram({
      name: 'marketplace_database_latency_seconds',
      help: 'Database query latency in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.register],
    });

    this.cacheLatency = new Histogram({
      name: 'marketplace_cache_latency_seconds',
      help: 'Cache operation latency in seconds',
      labelNames: ['operation', 'cache_type'],
      buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
      registers: [this.register],
    });

    this.externalApiLatency = new Histogram({
      name: 'marketplace_external_api_latency_seconds',
      help: 'External API call latency in seconds',
      labelNames: ['service', 'endpoint'],
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });
  }

  // Get metrics in Prometheus format
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Get metrics content type
  getContentType(): string {
    return this.register.contentType;
  }

  // Clear all metrics
  clear(): void {
    this.register.clear();
  }

  // Reset specific metric
  resetMetric(metric: Counter<string> | Histogram<string> | Gauge<string> | Summary<string>): void {
    metric.reset();
  }

  // Custom metric recording helpers
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    tenantId?: string,
  ): void {
    const labels = {
      method,
      route,
      status_code: statusCode.toString(),
      tenant_id: tenantId || 'unknown',
    };

    this.httpRequestDuration.observe(labels, duration);
    this.httpRequestTotal.inc(labels);

    if (statusCode >= 400) {
      this.httpRequestErrors.inc({
        method,
        route,
        error_type: statusCode >= 500 ? 'server_error' : 'client_error',
        tenant_id: tenantId || 'unknown',
      });
    }
  }

  recordOrder(
    status: string,
    paymentMethod: string,
    value: number,
    tenantId: string,
  ): void {
    this.ordersTotal.inc({
      status,
      payment_method: paymentMethod,
      tenant_id: tenantId,
    });
    this.ordersValue.observe({ tenant_id: tenantId }, value);
  }

  recordPayment(
    status: string,
    method: string,
    value: number,
    tenantId: string,
  ): void {
    this.paymentsTotal.inc({
      status,
      method,
      tenant_id: tenantId,
    });
    this.paymentsValue.observe(
      { status, method, tenant_id: tenantId },
      value,
    );
  }

  recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
  ): void {
    this.databaseLatency.observe({ operation, table }, duration);
  }

  recordCacheOperation(
    operation: string,
    cacheType: string,
    duration: number,
  ): void {
    this.cacheLatency.observe(
      { operation, cache_type: cacheType },
      duration,
    );
  }

  recordQueueJob(
    queueName: string,
    jobType: string,
    processingTime: number,
  ): void {
    this.queueProcessingTime.observe(
      { queue_name: queueName, job_type: jobType },
      processingTime,
    );
  }

  updateActiveUsers(count: number, tenantId: string): void {
    this.activeUsers.set({ tenant_id: tenantId }, count);
  }

  updateQueueSize(queueName: string, status: string, size: number): void {
    this.queueSize.set({ queue_name: queueName, status }, size);
  }

  updateCacheHitRate(cacheType: string, rate: number): void {
    this.cacheHitRate.set({ cache_type: cacheType }, rate);
  }
}