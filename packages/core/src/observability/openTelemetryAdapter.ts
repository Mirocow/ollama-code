/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OpenTelemetry Adapter
 * Adapts internal telemetry to OpenTelemetry standard format.
 */

import type { Tracer, CompletedSpan } from './tracer.js';
import type { AggregatedMetric, MetricsCollector } from './metricsCollector.js';

// ============================================================================
// Types
// ============================================================================

/**
 * OpenTelemetry configuration
 */
export interface OpenTelemetryConfig {
  /** OTLP endpoint URL */
  endpoint: string;
  /** Protocol: grpc or http/protobuf or http/json */
  protocol: 'grpc' | 'http/protobuf' | 'http/json';
  /** Headers for authentication */
  headers: Record<string, string>;
  /** Export timeout (ms) */
  timeout: number;
  /** Enable trace export */
  enableTraces: boolean;
  /** Enable metrics export */
  enableMetrics: boolean;
  /** Enable logs export */
  enableLogs: boolean;
  /** Batch size for export */
  batchSize: number;
  /** Export interval (ms) */
  exportInterval: number;
  /** Resource attributes */
  resource: {
    'service.name': string;
    'service.version': string;
    'deployment.environment'?: string;
    [key: string]: string | undefined;
  };
}

/**
 * OTLP Resource
 */
interface OTLPResource {
  attributes: Array<{ key: string; value: { stringValue?: string; intValue?: string } }>;
  droppedAttributesCount: number;
}

/**
 * OTLP Span
 */
interface OTLPSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Array<{ key: string; value: { stringValue?: string; intValue?: string; doubleValue?: number } }>;
  droppedAttributesCount: number;
  events: Array<{
    timeUnixNano: string;
    name: string;
    attributes: Array<{ key: string; value: { stringValue?: string } }>;
    droppedAttributesCount: number;
  }>;
  droppedEventsCount: number;
  status: { code: number; message?: string };
}

/**
 * OTLP Metric
 */
interface OTLPMetric {
  name: string;
  description?: string;
  unit?: string;
  data: {
    gauge?: {
      dataPoints: Array<{
        timeUnixNano: string;
        asDouble?: number;
        asInt?: string;
        attributes: Array<{ key: string; value: { stringValue?: string } }>;
      }>;
    };
    sum?: {
      dataPoints: Array<{
        timeUnixNano: string;
        asDouble?: number;
        asInt?: string;
        attributes: Array<{ key: string; value: { stringValue?: string } }>;
      }>;
      aggregationTemporality: number;
      isMonotonic: boolean;
    };
    histogram?: {
      dataPoints: Array<{
        timeUnixNano: string;
        count: string;
        sum: number;
        bucketCounts: string[];
        explicitBounds: number[];
        attributes: Array<{ key: string; value: { stringValue?: string } }>;
      }>;
      aggregationTemporality: number;
    };
  };
}

/**
 * OTLP Export Request
 */
interface OTLPExportRequest {
  resourceSpans?: Array<{
    resource: OTLPResource;
    scopeSpans: Array<{
      scope: { name: string };
      spans: OTLPSpan[];
    }>;
  }>;
  resourceMetrics?: Array<{
    resource: OTLPResource;
    scopeMetrics: Array<{
      scope: { name: string };
      metrics: OTLPMetric[];
    }>;
  }>;
}

// ============================================================================
// OpenTelemetry Adapter Implementation
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: OpenTelemetryConfig = {
  endpoint: 'http://localhost:4318',
  protocol: 'http/json',
  headers: {},
  timeout: 30000,
  enableTraces: true,
  enableMetrics: true,
  enableLogs: false,
  batchSize: 100,
  exportInterval: 60000,
  resource: {
    'service.name': 'ollama-code',
    'service.version': '0.10.5',
  },
};

/**
 * OpenTelemetry Adapter
 *
 * Adapts internal telemetry to OpenTelemetry OTLP format
 * for export to observability backends.
 *
 * @example
 * const adapter = new OpenTelemetryAdapter({
 *   endpoint: 'http://localhost:4318/v1/traces',
 *   resource: {
 *     'service.name': 'my-service',
 *   },
 * }, tracer, metricsCollector);
 *
 * // Export traces
 * await adapter.exportTraces(spans);
 */
export class OpenTelemetryAdapter {
  private config: OpenTelemetryConfig;
  private metricsCollector?: MetricsCollector;
  private spanBuffer: CompletedSpan[] = [];
  private metricBuffer: OTLPMetric[] = [];
  private exportTimer?: NodeJS.Timeout;

  constructor(
    config: Partial<OpenTelemetryConfig>,
    _tracer?: Tracer,
    metricsCollector?: MetricsCollector,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metricsCollector = metricsCollector;

    this.startExportTimer();
  }

  /**
   * Convert span to OTLP format
   */
  convertSpan(span: CompletedSpan): OTLPSpan {
    return {
      traceId: this.hexToBase64(span.traceId),
      spanId: this.hexToBase64(span.spanId),
      parentSpanId: span.parentSpanId ? this.hexToBase64(span.parentSpanId) : undefined,
      name: span.name,
      kind: this.mapSpanKind(span.kind),
      startTimeUnixNano: (span.startTime * 1000000).toString(),
      endTimeUnixNano: ((span.endTime ?? Date.now()) * 1000000).toString(),
      attributes: this.convertAttributes(span.attributes),
      droppedAttributesCount: 0,
      events: span.events.map((event) => ({
        timeUnixNano: (event.timestamp * 1000000).toString(),
        name: event.name,
        attributes: event.attributes ? this.convertAttributes(event.attributes) : [],
        droppedAttributesCount: 0,
      })),
      droppedEventsCount: 0,
      status: this.convertStatus(span.status),
    };
  }

  /**
   * Convert metric to OTLP format
   */
  convertMetric(metric: AggregatedMetric): OTLPMetric {
    const otlpMetric: OTLPMetric = {
      name: metric.name,
      description: metric.description,
      unit: metric.unit,
      data: {},
    };

    const timeUnixNano = (Date.now() * 1000000).toString();

    if (metric.type === 'gauge' || metric.type === 'counter') {
      const isCounter = metric.type === 'counter';
      otlpMetric.data = {
        [isCounter ? 'sum' : 'gauge']: {
          dataPoints: metric.values.map((v) => ({
            timeUnixNano,
            asDouble: v.value,
            attributes: this.convertLabels(v.labels),
          })),
          ...(isCounter
            ? { aggregationTemporality: 1, isMonotonic: true }
            : {}),
        },
      };
    } else if (metric.type === 'histogram') {
      otlpMetric.data = {
        histogram: {
          dataPoints: metric.values.map((v) => ({
            timeUnixNano,
            count: (v.count ?? 0).toString(),
            sum: v.sum ?? 0,
            bucketCounts: v.buckets
              ? Object.values(v.buckets).map((c) => c.toString())
              : [],
            explicitBounds: v.buckets
              ? Object.keys(v.buckets).map((b) => parseFloat(b) || Infinity)
              : [],
            attributes: this.convertLabels(v.labels),
          })),
          aggregationTemporality: 1,
        },
      };
    }

    return otlpMetric;
  }

  /**
   * Export traces to OTLP endpoint
   */
  async exportTraces(spans: CompletedSpan[]): Promise<void> {
    if (!this.config.enableTraces || spans.length === 0) return;

    const resourceSpans = this.groupSpansByTrace(spans);
    const request: OTLPExportRequest = { resourceSpans };

    await this.send('/v1/traces', request);
  }

  /**
   * Export metrics to OTLP endpoint
   */
  async exportMetrics(metrics: AggregatedMetric[]): Promise<void> {
    if (!this.config.enableMetrics || metrics.length === 0) return;

    const resourceMetrics = [{
      resource: this.createResource(),
      scopeMetrics: [{
        scope: { name: 'ollama-code' },
        metrics: metrics.map((m) => this.convertMetric(m)),
      }],
    }];

    const request: OTLPExportRequest = { resourceMetrics };
    await this.send('/v1/metrics', request);
  }

  /**
   * Flush all buffered data
   */
  async flush(): Promise<void> {
    if (this.spanBuffer.length > 0) {
      await this.exportTraces(this.spanBuffer);
      this.spanBuffer = [];
    }

    if (this.metricBuffer.length > 0 && this.metricsCollector) {
      const metrics = this.metricsCollector.getAllMetrics();
      await this.exportMetrics(metrics);
      this.metricBuffer = [];
    }
  }

  /**
   * Shutdown adapter
   */
  async shutdown(): Promise<void> {
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = undefined;
    }
    await this.flush();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private startExportTimer(): void {
    if (this.config.exportInterval > 0) {
      this.exportTimer = setInterval(() => {
        this.flush().catch(() => {
          // Ignore export errors
        });
      }, this.config.exportInterval);
    }
  }

  private async send(path: string, data: OTLPExportRequest): Promise<void> {
    const url = `${this.config.endpoint}${path}`;

    const headers: Record<string, string> = {
      'Content-Type':
        this.config.protocol === 'http/json'
          ? 'application/json'
          : 'application/x-protobuf',
      ...this.config.headers,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`OTLP export failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Log error but don't throw
      console.error('OpenTelemetry export error:', error);
    }
  }

  private createResource(): OTLPResource {
    return {
      attributes: Object.entries(this.config.resource)
        .filter(([, v]) => v !== undefined)
        .map(([key, value]) => ({
          key,
          value: { stringValue: value },
        })),
      droppedAttributesCount: 0,
    };
  }

  private groupSpansByTrace(spans: CompletedSpan[]): OTLPExportRequest['resourceSpans'] {
    const traceMap = new Map<string, CompletedSpan[]>();

    for (const span of spans) {
      const trace = traceMap.get(span.traceId) ?? [];
      trace.push(span);
      traceMap.set(span.traceId, trace);
    }

    return [{
      resource: this.createResource(),
      scopeSpans: [{
        scope: { name: 'ollama-code' },
        spans: spans.map((s) => this.convertSpan(s)),
      }],
    }];
  }

  private convertAttributes(attrs: Record<string, unknown>): Array<{ key: string; value: { stringValue?: string; intValue?: string; doubleValue?: number } }> {
    return Object.entries(attrs).map(([key, value]) => {
      if (typeof value === 'string') {
        return { key, value: { stringValue: value } };
      } else if (typeof value === 'number') {
        return Number.isInteger(value)
          ? { key, value: { intValue: value.toString() } }
          : { key, value: { doubleValue: value } };
      } else {
        return { key, value: { stringValue: JSON.stringify(value) } };
      }
    });
  }

  private convertLabels(labels: Record<string, string>): Array<{ key: string; value: { stringValue?: string } }> {
    return Object.entries(labels).map(([key, value]) => ({
      key,
      value: { stringValue: value },
    }));
  }

  private convertStatus(status: { code: string; message?: string }): { code: number; message?: string } {
    let code: number;
    switch (status.code) {
      case 'ok':
        code = 1;
        break;
      case 'error':
        code = 2;
        break;
      default:
        code = 0;
    }
    return { code, message: status.message };
  }

  private mapSpanKind(kind: string): number {
    switch (kind) {
      case 'internal':
        return 1;
      case 'server':
        return 2;
      case 'client':
        return 3;
      case 'producer':
        return 4;
      case 'consumer':
        return 5;
      default:
        return 1;
    }
  }

  private hexToBase64(hex: string): string {
    const buffer = Buffer.from(hex, 'hex');
    return buffer.toString('base64');
  }
}

export default OpenTelemetryAdapter;
