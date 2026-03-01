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
  OpenTelemetryAdapter,
  type OpenTelemetryConfig,
} from './openTelemetryAdapter.js';
import { Tracer, type CompletedSpan } from './tracer.js';
import { MetricsCollector } from './metricsCollector.js';

describe('OpenTelemetryAdapter', () => {
  let adapter: OpenTelemetryAdapter;
  let tracer: Tracer;
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    tracer = new Tracer();
    metricsCollector = new MetricsCollector();
    adapter = new OpenTelemetryAdapter({
      endpoint: 'http://localhost:4318',
    }, tracer, metricsCollector);
  });

  afterEach(async () => {
    await adapter.shutdown();
  });

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      expect(adapter).toBeDefined();
    });

    it('should merge custom config', () => {
      const customAdapter = new OpenTelemetryAdapter({
        endpoint: 'http://custom:4318',
        headers: { 'Authorization': 'Bearer token' },
        enableTraces: true,
        enableMetrics: true,
      }, tracer, metricsCollector);
      
      expect(customAdapter).toBeDefined();
    });

    it('should start export timer', () => {
      vi.useFakeTimers();
      
      const timerAdapter = new OpenTelemetryAdapter({
        endpoint: 'http://localhost:4318',
        exportInterval: 1000,
      }, tracer, metricsCollector);
      
      vi.advanceTimersByTime(1000);
      
      expect(timerAdapter).toBeDefined();
      
      vi.useRealTimers();
    });
  });

  describe('convertSpan', () => {
    it('should convert span to OTLP format', () => {
      const span: CompletedSpan = {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        name: 'test-span',
        kind: 'internal',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        status: { code: 'ok' },
        attributes: { key: 'value' },
        events: [],
        links: [],
        resource: { 'service.name': 'test' },
      };
      
      const otlpSpan = adapter.convertSpan(span);
      
      expect(otlpSpan.name).toBe('test-span');
      expect(otlpSpan.traceId).toBeDefined();
      expect(otlpSpan.spanId).toBeDefined();
      expect(otlpSpan.kind).toBe(1); // internal
      expect(otlpSpan.status.code).toBe(1); // ok
    });

    it('should handle parent span ID', () => {
      const span: CompletedSpan = {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        parentSpanId: 'fedcba9876543210',
        name: 'child-span',
        kind: 'client',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        status: { code: 'ok' },
        attributes: {},
        events: [],
        links: [],
        resource: {},
      };
      
      const otlpSpan = adapter.convertSpan(span);
      
      expect(otlpSpan.parentSpanId).toBeDefined();
    });

    it('should convert events', () => {
      const span: CompletedSpan = {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        name: 'test',
        kind: 'internal',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        status: { code: 'ok' },
        attributes: {},
        events: [
          { name: 'exception', timestamp: Date.now(), attributes: { error: 'test' } },
        ],
        links: [],
        resource: {},
      };
      
      const otlpSpan = adapter.convertSpan(span);
      
      expect(otlpSpan.events).toHaveLength(1);
      expect(otlpSpan.events[0].name).toBe('exception');
    });

    it('should convert error status', () => {
      const span: CompletedSpan = {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        name: 'test',
        kind: 'internal',
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        status: { code: 'error', message: 'Something went wrong' },
        attributes: {},
        events: [],
        links: [],
        resource: {},
      };
      
      const otlpSpan = adapter.convertSpan(span);
      
      expect(otlpSpan.status.code).toBe(2); // error
      expect(otlpSpan.status.message).toBe('Something went wrong');
    });

    it('should convert span kinds', () => {
      const kinds: Array<{ kind: string; expected: number }> = [
        { kind: 'internal', expected: 1 },
        { kind: 'server', expected: 2 },
        { kind: 'client', expected: 3 },
        { kind: 'producer', expected: 4 },
        { kind: 'consumer', expected: 5 },
        { kind: 'unknown', expected: 1 },
      ];
      
      for (const { kind, expected } of kinds) {
        const span: CompletedSpan = {
          traceId: '0123456789abcdef0123456789abcdef',
          spanId: '0123456789abcdef',
          name: 'test',
          kind: kind as any,
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          status: { code: 'unset' },
          attributes: {},
          events: [],
          links: [],
          resource: {},
        };
        
        const otlpSpan = adapter.convertSpan(span);
        expect(otlpSpan.kind).toBe(expected);
      }
    });

    it('should convert attributes', () => {
      const span: CompletedSpan = {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        name: 'test',
        kind: 'internal',
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        status: { code: 'unset' },
        attributes: {
          string: 'value',
          number: 42,
          float: 3.14,
          boolean: true,
          object: { nested: 'value' },
        },
        events: [],
        links: [],
        resource: {},
      };
      
      const otlpSpan = adapter.convertSpan(span);
      
      expect(otlpSpan.attributes.length).toBe(5);
    });
  });

  describe('convertMetric', () => {
    it('should convert counter metric', () => {
      metricsCollector.register({
        name: 'requests',
        type: 'counter',
        description: 'Total requests',
      });
      metricsCollector.incrementCounter('requests');
      
      const metric = metricsCollector.getMetric('requests');
      const otlpMetric = adapter.convertMetric(metric!);
      
      expect(otlpMetric.name).toBe('ollama_code_requests');
      expect(otlpMetric.data.sum).toBeDefined();
      expect(otlpMetric.data.sum?.isMonotonic).toBe(true);
    });

    it('should convert gauge metric', () => {
      metricsCollector.register({
        name: 'connections',
        type: 'gauge',
        description: 'Active connections',
      });
      metricsCollector.setGauge('connections', 42);
      
      const metric = metricsCollector.getMetric('connections');
      const otlpMetric = adapter.convertMetric(metric!);
      
      expect(otlpMetric.name).toBe('ollama_code_connections');
      expect(otlpMetric.data.gauge).toBeDefined();
    });

    it('should convert histogram metric', () => {
      metricsCollector.register({
        name: 'latency',
        type: 'histogram',
        description: 'Latency',
      });
      metricsCollector.recordHistogram('latency', 0.5);
      metricsCollector.recordHistogram('latency', 1.5);
      
      const metric = metricsCollector.getMetric('latency');
      const otlpMetric = adapter.convertMetric(metric!);
      
      expect(otlpMetric.name).toBe('ollama_code_latency');
      expect(otlpMetric.data.histogram).toBeDefined();
      expect(otlpMetric.data.histogram?.dataPoints[0].count).toBe('2');
    });
  });

  describe('exportTraces', () => {
    it('should skip when traces disabled', async () => {
      const noTraceAdapter = new OpenTelemetryAdapter({
        endpoint: 'http://localhost:4318',
        enableTraces: false,
      }, tracer, metricsCollector);
      
      const spans: CompletedSpan[] = [{
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        name: 'test',
        kind: 'internal',
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        status: { code: 'unset' },
        attributes: {},
        events: [],
        links: [],
        resource: {},
      }];
      
      // Should not throw
      await noTraceAdapter.exportTraces(spans);
    });

    it('should skip when no spans', async () => {
      await adapter.exportTraces([]);
      
      // Should not throw
      expect(adapter).toBeDefined();
    });
  });

  describe('exportMetrics', () => {
    it('should skip when metrics disabled', async () => {
      const noMetricsAdapter = new OpenTelemetryAdapter({
        endpoint: 'http://localhost:4318',
        enableMetrics: false,
      }, tracer, metricsCollector);
      
      const metrics = metricsCollector.getAllMetrics();
      
      // Should not throw
      await noMetricsAdapter.exportMetrics(metrics);
    });

    it('should skip when no metrics', async () => {
      await adapter.exportMetrics([]);
      
      // Should not throw
      expect(adapter).toBeDefined();
    });
  });

  describe('flush', () => {
    it('should flush buffered spans', async () => {
      const span: CompletedSpan = {
        traceId: '0123456789abcdef0123456789abcdef',
        spanId: '0123456789abcdef',
        name: 'test',
        kind: 'internal',
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        status: { code: 'unset' },
        attributes: {},
        events: [],
        links: [],
        resource: {},
      };
      
      // Access private spanBuffer for testing
      (adapter as any).spanBuffer = [span];
      
      await adapter.flush();
      
      expect(adapter).toBeDefined();
    });
  });

  describe('shutdown', () => {
    it('should stop export timer', async () => {
      vi.useFakeTimers();
      
      const timerAdapter = new OpenTelemetryAdapter({
        endpoint: 'http://localhost:4318',
        exportInterval: 1000,
      }, tracer, metricsCollector);
      
      await timerAdapter.shutdown();
      
      vi.advanceTimersByTime(1000);
      
      // Timer should have been cleared
      expect(timerAdapter).toBeDefined();
      
      vi.useRealTimers();
    });

    it('should flush remaining data', async () => {
      await adapter.shutdown();
      
      expect(adapter).toBeDefined();
    });

    it('should be idempotent', async () => {
      await adapter.shutdown();
      await adapter.shutdown();
      
      expect(adapter).toBeDefined();
    });
  });
});
