/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Prometheus Exporter
 * Exports metrics in Prometheus text format for scraping.
 */

import type { MetricsCollector, AggregatedMetric } from './metricsCollector.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Prometheus configuration
 */
export interface PrometheusConfig {
  /** Enable Prometheus export */
  enabled: boolean;
  /** Port for metrics server (0 = no server) */
  port: number;
  /** Endpoint path */
  path: string;
  /** Include help text */
  includeHelp: boolean;
  /** Include type information */
  includeType: boolean;
  /** Metric name replacements */
  nameReplacements: Array<{ pattern: RegExp; replacement: string }>;
  /** Maximum metric name length */
  maxNameLength: number;
}

/**
 * Prometheus metric format
 */
export interface PrometheusMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary' | 'untyped';
  help?: string;
  samples: Array<{
    name: string;
    labels: Record<string, string>;
    value: number;
    timestamp?: number;
  }>;
}

// ============================================================================
// Prometheus Exporter Implementation
// ============================================================================

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PrometheusConfig = {
  enabled: true,
  port: 9090,
  path: '/metrics',
  includeHelp: true,
  includeType: true,
  nameReplacements: [
    { pattern: /[^a-zA-Z0-9_:]/g, replacement: '_' },
    { pattern: /^_+/, replacement: '' },
    { pattern: /_+$/, replacement: '' },
  ],
  maxNameLength: 128,
};

/**
 * Prometheus Exporter
 *
 * Exports metrics in Prometheus text format for monitoring systems.
 *
 * @example
 * const exporter = new PrometheusExporter({
 *   port: 9090,
 * }, metricsCollector);
 *
 * // Get metrics as text
 * const text = exporter.export();
 *
 * // Or serve via HTTP
 * exporter.startServer();
 */
export class PrometheusExporter {
  private config: PrometheusConfig;
  private collector: MetricsCollector;
  private server?: ReturnType<typeof import('node:http').createServer>;

  constructor(config: Partial<PrometheusConfig>, collector: MetricsCollector) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.collector = collector;
  }

  /**
   * Export metrics in Prometheus text format
   */
  export(): string {
    const metrics = this.collector.getAllMetrics();
    const lines: string[] = [];

    for (const metric of metrics) {
      const promMetric = this.convertToPrometheus(metric);
      lines.push(...this.formatMetric(promMetric));
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Start HTTP server for metrics endpoint
   */
  async startServer(): Promise<void> {
    if (this.server || this.config.port === 0) {
      return;
    }

    const http = await import('node:http');

    this.server = http.createServer((req, res) => {
      if (req.url === this.config.path && req.method === 'GET') {
        const metrics = this.export();
        res.writeHead(200, {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        });
        res.end(metrics);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    return new Promise((resolve) => {
      this.server!.listen(this.config.port, () => {
        resolve();
      });
    });
  }

  /**
   * Stop HTTP server
   */
  async stopServer(): Promise<void> {
    if (!this.server) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = undefined;
          resolve();
        }
      });
    });
  }

  /**
   * Flush any pending data
   */
  async flush(): Promise<void> {
    // No-op for Prometheus exporter (metrics are pulled, not pushed)
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private convertToPrometheus(metric: AggregatedMetric): PrometheusMetric {
    const name = this.sanitizeName(metric.name);
    const type = this.mapType(metric.type);

    const samples: PrometheusMetric['samples'] = [];

    for (const value of metric.values) {
      if (type === 'histogram') {
        // Histogram format: _bucket, _sum, _count
        if (value.buckets) {
          for (const [bucket, count] of Object.entries(value.buckets)) {
            samples.push({
              name: `${name}_bucket`,
              labels: { ...value.labels, le: bucket },
              value: count,
            });
          }
        }
        if (value.sum !== undefined) {
          samples.push({
            name: `${name}_sum`,
            labels: value.labels,
            value: value.sum,
          });
        }
        if (value.count !== undefined) {
          samples.push({
            name: `${name}_count`,
            labels: value.labels,
            value: value.count,
          });
        }
      } else if (type === 'summary') {
        // Summary format: _bucket (quantile), _sum, _count
        if (value.quantiles) {
          for (const [quantile, qvalue] of Object.entries(value.quantiles)) {
            samples.push({
              name,
              labels: { ...value.labels, quantile },
              value: qvalue,
            });
          }
        }
        if (value.sum !== undefined) {
          samples.push({
            name: `${name}_sum`,
            labels: value.labels,
            value: value.sum,
          });
        }
        if (value.count !== undefined) {
          samples.push({
            name: `${name}_count`,
            labels: value.labels,
            value: value.count,
          });
        }
      } else {
        samples.push({
          name,
          labels: value.labels,
          value: value.value,
        });
      }
    }

    return {
      name,
      type,
      help: metric.description,
      samples,
    };
  }

  private formatMetric(metric: PrometheusMetric): string[] {
    const lines: string[] = [];

    // Add TYPE
    if (this.config.includeType) {
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
    }

    // Add HELP
    if (this.config.includeHelp && metric.help) {
      lines.push(`# HELP ${metric.name} ${this.escapeHelp(metric.help)}`);
    }

    // Add samples
    for (const sample of metric.samples) {
      const labelStr = this.formatLabels(sample.labels);
      if (labelStr) {
        lines.push(`${sample.name}{${labelStr}} ${sample.value}`);
      } else {
        lines.push(`${sample.name} ${sample.value}`);
      }
    }

    lines.push(''); // Empty line between metrics
    return lines;
  }

  private sanitizeName(name: string): string {
    let sanitized = name;
    for (const { pattern, replacement } of this.config.nameReplacements) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    if (sanitized.length > this.config.maxNameLength) {
      sanitized = sanitized.substring(0, this.config.maxNameLength);
    }
    return sanitized;
  }

  private mapType(type: string): PrometheusMetric['type'] {
    switch (type) {
      case 'counter':
      case 'gauge':
      case 'histogram':
      case 'summary':
        return type;
      default:
        return 'untyped';
    }
  }

  private formatLabels(labels: Record<string, string>): string {
    return Object.entries(labels)
      .map(([k, v]) => `${this.sanitizeLabelName(k)}="${this.escapeLabelValue(v)}"`)
      .join(',');
  }

  private sanitizeLabelName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private escapeLabelValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  private escapeHelp(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
  }
}

export default PrometheusExporter;
