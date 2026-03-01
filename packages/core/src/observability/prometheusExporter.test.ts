/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  PrometheusExporter,
  type PrometheusConfig,
} from './prometheusExporter.js';
import { MetricsCollector } from './metricsCollector.js';

describe('PrometheusExporter', () => {
  let collector: MetricsCollector;
  let exporter: PrometheusExporter;

  beforeEach(() => {
    collector = new MetricsCollector();
    exporter = new PrometheusExporter({}, collector);
  });

  afterEach(() => {
    exporter.stopServer().catch(() => {});
  });

  describe('constructor', () => {
    it('should create exporter with default config', () => {
      expect(exporter).toBeDefined();
    });

    it('should merge custom config', () => {
      const customExporter = new PrometheusExporter({
        port: 8080,
        path: '/metrics',
      }, collector);
      
      expect(customExporter).toBeDefined();
    });
  });

  describe('export', () => {
    it('should export empty metrics', () => {
      const output = exporter.export();
      
      expect(output).toBe('\n');
    });

    it('should export counter metric', () => {
      collector.register({
        name: 'requests_total',
        type: 'counter',
        description: 'Total requests',
      });
      collector.incrementCounter('requests_total');
      
      const output = exporter.export();
      
      expect(output).toContain('# TYPE ollama_code_requests_total counter');
      expect(output).toContain('# HELP ollama_code_requests_total Total requests');
      expect(output).toContain('ollama_code_requests_total');
    });

    it('should export gauge metric', () => {
      collector.register({
        name: 'connections',
        type: 'gauge',
        description: 'Active connections',
      });
      collector.setGauge('connections', 42);
      
      const output = exporter.export();
      
      expect(output).toContain('# TYPE ollama_code_connections gauge');
      expect(output).toContain('ollama_code_connections 42');
    });

    it('should export histogram metric', () => {
      collector.register({
        name: 'latency',
        type: 'histogram',
        description: 'Request latency',
        buckets: [0.1, 0.5, 1, 5],
      });
      collector.recordHistogram('latency', 0.3);
      collector.recordHistogram('latency', 1.5);
      
      const output = exporter.export();
      
      expect(output).toContain('# TYPE ollama_code_latency histogram');
      expect(output).toContain('ollama_code_latency_bucket');
      expect(output).toContain('ollama_code_latency_sum');
      expect(output).toContain('ollama_code_latency_count');
    });

    it('should export summary metric', () => {
      collector.register({
        name: 'duration',
        type: 'summary',
        description: 'Request duration',
        quantiles: [0.5, 0.9, 0.99],
      });
      
      for (let i = 1; i <= 10; i++) {
        collector.record('duration', i);
      }
      
      const output = exporter.export();
      
      expect(output).toContain('# TYPE ollama_code_duration summary');
      expect(output).toContain('ollama_code_duration_sum');
      expect(output).toContain('ollama_code_duration_count');
    });

    it('should include labels', () => {
      collector.register({
        name: 'http_requests',
        type: 'counter',
        description: 'HTTP requests',
      });
      collector.incrementCounter('http_requests', { method: 'GET', status: '200' });
      
      const output = exporter.export();
      
      expect(output).toContain('method="GET"');
      expect(output).toContain('status="200"');
    });

    it('should escape special characters in label values', () => {
      collector.register({
        name: 'test',
        type: 'counter',
        description: 'Test',
      });
      collector.incrementCounter('test', { value: 'hello "world"\nnew line' });
      
      const output = exporter.export();
      
      expect(output).toContain('hello \\"world\\"\\nnew line');
    });

    it('should exclude help when disabled', () => {
      const noHelpExporter = new PrometheusExporter({
        includeHelp: false,
      }, collector);
      
      collector.register({
        name: 'test',
        type: 'counter',
        description: 'Test description',
      });
      collector.incrementCounter('test');
      
      const output = noHelpExporter.export();
      
      expect(output).not.toContain('# HELP');
    });

    it('should exclude type when disabled', () => {
      const noTypeExporter = new PrometheusExporter({
        includeType: false,
      }, collector);
      
      collector.register({
        name: 'test',
        type: 'counter',
        description: 'Test',
      });
      collector.incrementCounter('test');
      
      const output = noTypeExporter.export();
      
      expect(output).not.toContain('# TYPE');
    });
  });

  describe('sanitizeName', () => {
    it('should sanitize metric names', () => {
      collector.register({
        name: 'my-metric.name',
        type: 'counter',
        description: 'Test',
      });
      collector.incrementCounter('my-metric.name');
      
      const output = exporter.export();
      
      expect(output).toContain('ollama_code_my_metric_name');
    });

    it('should truncate long names', () => {
      const longName = 'a'.repeat(200);
      collector.register({
        name: longName,
        type: 'counter',
        description: 'Test',
      });
      collector.incrementCounter(longName);
      
      const output = exporter.export();
      
      // Check the output contains a truncated name
      expect(output).toContain('ollama_code_');
    });
  });

  describe('startServer', () => {
    it('should not start server if port is 0', async () => {
      const noServerExporter = new PrometheusExporter({ port: 0 }, collector);
      
      await noServerExporter.startServer();
      
      // Should not error
      expect(noServerExporter).toBeDefined();
    });

    it('should not start server if already running', async () => {
      const serverExporter = new PrometheusExporter({ port: 9091 }, collector);
      
      await serverExporter.startServer();
      await serverExporter.startServer(); // Second call should be no-op
      
      await serverExporter.stopServer();
      
      expect(serverExporter).toBeDefined();
    });
  });

  describe('stopServer', () => {
    it('should handle stopping when not started', async () => {
      await exporter.stopServer();
      
      expect(exporter).toBeDefined();
    });
  });

  describe('flush', () => {
    it('should be a no-op', async () => {
      await exporter.flush();
      
      expect(exporter).toBeDefined();
    });
  });
});
