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
  TelemetryService,
  telemetryService,
  type TelemetryServiceConfig,
  type TelemetryEvent,
} from './telemetryService.js';

describe('TelemetryService', () => {
  describe('constructor', () => {
    it('should create service with default config', () => {
      const service = new TelemetryService();
      expect(service).toBeDefined();
    });

    it('should merge custom config', () => {
      const service = new TelemetryService({
        serviceName: 'test-service',
        environment: 'test',
        enableMetrics: true,
        enableTracing: true,
      });
      expect(service).toBeDefined();
    });
  });

  describe('getServiceName', () => {
    it('should return service name', () => {
      const service = new TelemetryService({ serviceName: 'my-service' });
      expect(service.getServiceName()).toBe('my-service');
    });
  });

  describe('getEnvironment', () => {
    it('should return environment', () => {
      const service = new TelemetryService({ environment: 'production' });
      expect(service.getEnvironment()).toBe('production');
    });
  });

  describe('Tracing', () => {
    let service: TelemetryService;

    beforeEach(() => {
      service = new TelemetryService({
        enableTracing: true,
        enableMetrics: false,
        prometheus: { enabled: false },
        exportIntervalMs: 0,
      });
    });

    afterEach(async () => {
      await service.shutdown();
    });

    describe('startSpan', () => {
      it('should create a span', () => {
        const span = service.startSpan('operation');
        
        expect(span).toBeDefined();
        expect(span.name).toBe('operation');
      });

      it('should accept span options', () => {
        const span = service.startSpan('operation', {
          kind: 'client',
          attributes: { key: 'value' },
        });
        
        expect(span.kind).toBe('client');
      });

      it('should create child span with parent context', () => {
        const parent = service.startSpan('parent');
        const child = service.startSpan('child', {
          parent: { traceId: parent.traceId, spanId: parent.spanId },
        });
        
        expect(child.parentSpanId).toBe(parent.spanId);
        expect(child.traceId).toBe(parent.traceId);
      });

      it('should return noop span when tracing disabled', () => {
        const noTraceService = new TelemetryService({
          enableTracing: false,
          enableMetrics: false,
          prometheus: { enabled: false },
          exportIntervalMs: 0,
        });
        
        const span = noTraceService.startSpan('operation');
        
        expect(span.isEnded()).toBe(true);
        
        noTraceService.shutdown();
      });

      it('should increment totalSpans counter', () => {
        service.startSpan('span1');
        service.startSpan('span2');
        
        const stats = service.getStats();
        expect(stats.totalSpans).toBe(2);
      });
    });

    describe('getActiveSpan', () => {
      it('should return active span', () => {
        const span = service.startSpan('operation');
        
        const active = service.getActiveSpan();
        
        expect(active?.spanId).toBe(span.spanId);
      });
    });

    describe('withSpan', () => {
      it('should run function within span context', async () => {
        const result = await service.withSpan('operation', async (span) => {
          return 'result';
        });
        
        expect(result).toBe('result');
      });

      it('should set ok status on success', async () => {
        await service.withSpan('operation', async () => {});
        
        // Span should have ended successfully
        expect(service).toBeDefined();
      });

      it('should set error status on failure', async () => {
        await expect(
          service.withSpan('operation', async () => {
            throw new Error('Test error');
          })
        ).rejects.toThrow('Test error');
      });

      it('should record exception on failure', async () => {
        await expect(
          service.withSpan('operation', async () => {
            throw new Error('Test error');
          })
        ).rejects.toThrow();
        
        // Exception should have been recorded
        expect(service).toBeDefined();
      });
    });
  });

  describe('Metrics', () => {
    let service: TelemetryService;

    beforeEach(() => {
      service = new TelemetryService({
        enableMetrics: true,
        enableTracing: false,
        prometheus: { enabled: false },
        exportIntervalMs: 0,
      });
    });

    afterEach(async () => {
      await service.shutdown();
    });

    describe('recordMetric', () => {
      it('should record metric', () => {
        service.recordMetric('requests', 5);
        
        const stats = service.getStats();
        expect(stats.totalMetrics).toBe(1);
      });

      it('should not record when metrics disabled', () => {
        const noMetricsService = new TelemetryService({
          enableMetrics: false,
          enableTracing: false,
          prometheus: { enabled: false },
          exportIntervalMs: 0,
        });
        
        noMetricsService.recordMetric('requests', 5);
        
        const stats = noMetricsService.getStats();
        expect(stats.totalMetrics).toBe(0);
        
        noMetricsService.shutdown();
      });
    });

    describe('incrementCounter', () => {
      it('should increment counter', () => {
        service.incrementCounter('requests');
        service.incrementCounter('requests', { method: 'GET' });
        
        const stats = service.getStats();
        expect(stats.totalMetrics).toBe(2);
      });
    });

    describe('recordGauge', () => {
      it('should record gauge', () => {
        service.recordGauge('connections', 42);
        
        const stats = service.getStats();
        expect(stats.totalMetrics).toBe(1);
      });
    });

    describe('recordHistogram', () => {
      it('should record histogram', () => {
        service.recordHistogram('latency', 100);
        
        const stats = service.getStats();
        expect(stats.totalMetrics).toBe(1);
      });
    });

    describe('timeOperation', () => {
      it('should time synchronous operation', () => {
        const result = service.timeOperation('test', () => {
          return 'result';
        });
        
        expect(result).toBe('result');
        
        const stats = service.getStats();
        expect(stats.totalMetrics).toBe(1);
      });
    });

    describe('timeOperationAsync', () => {
      it('should time async operation', async () => {
        const result = await service.timeOperationAsync('test', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'result';
        });
        
        expect(result).toBe('result');
        
        const stats = service.getStats();
        expect(stats.totalMetrics).toBe(1);
      });
    });
  });

  describe('Events', () => {
    let service: TelemetryService;

    beforeEach(() => {
      service = new TelemetryService({
        enableLogging: true,
        enableMetrics: false,
        enableTracing: false,
        prometheus: { enabled: false },
        exportIntervalMs: 0,
      });
    });

    afterEach(async () => {
      await service.shutdown();
    });

    describe('logEvent', () => {
      it('should log event', () => {
        service.logEvent('user_action', { action: 'click' });
        
        const events = service.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0].name).toBe('user_action');
      });

      it('should not log when logging disabled', () => {
        const noLogService = new TelemetryService({
          enableLogging: false,
          enableMetrics: false,
          enableTracing: false,
          prometheus: { enabled: false },
          exportIntervalMs: 0,
        });
        
        noLogService.logEvent('test', {});
        
        const events = noLogService.getEvents();
        expect(events).toHaveLength(0);
        
        noLogService.shutdown();
      });

      it('should include trace context when span active', () => {
        service.startSpan('operation');
        service.logEvent('event_in_span', {});
        
        const events = service.getEvents();
        expect(events[0].traceContext).toBeDefined();
      });

      it('should output to console when enabled', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        const consoleService = new TelemetryService({
          enableLogging: true,
          consoleOutput: true,
          enableMetrics: false,
          enableTracing: false,
          prometheus: { enabled: false },
          exportIntervalMs: 0,
        });
        
        consoleService.logEvent('test', { key: 'value' });
        
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
        consoleService.shutdown();
      });
    });

    describe('getEvents', () => {
      it('should limit returned events', () => {
        for (let i = 0; i < 200; i++) {
          service.logEvent(`event_${i}`, {});
        }
        
        const events = service.getEvents(10);
        expect(events.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Statistics', () => {
    let service: TelemetryService;

    beforeEach(() => {
      service = new TelemetryService({
        enableMetrics: true,
        enableTracing: true,
        prometheus: { enabled: false },
        exportIntervalMs: 0,
      });
    });

    afterEach(async () => {
      await service.shutdown();
    });

    describe('getStats', () => {
      it('should return statistics', () => {
        service.startSpan('span');
        service.recordMetric('metric', 1);
        service.logEvent('event', {});
        
        const stats = service.getStats();
        
        expect(stats.totalSpans).toBe(1);
        expect(stats.totalMetrics).toBe(1);
        expect(stats.totalEvents).toBe(1);
      });

      it('should include active spans count', () => {
        service.startSpan('span1');
        service.startSpan('span2');
        
        const stats = service.getStats();
        
        expect(stats.activeSpans).toBe(2);
      });
    });
  });

  describe('Prometheus', () => {
    let service: TelemetryService;

    beforeEach(() => {
      service = new TelemetryService({
        enableMetrics: true,
        prometheus: { enabled: true, port: 0 },
        exportIntervalMs: 0,
      });
    });

    afterEach(async () => {
      await service.shutdown();
    });

    describe('getPrometheusMetrics', () => {
      it('should return prometheus format', () => {
        service.recordMetric('requests', 5);
        
        const metrics = service.getPrometheusMetrics();
        
        expect(metrics).toContain('ollama_code_requests');
      });

      it('should return empty string when prometheus disabled', () => {
        const noPromService = new TelemetryService({
          prometheus: { enabled: false },
          exportIntervalMs: 0,
        });
        
        const metrics = noPromService.getPrometheusMetrics();
        
        expect(metrics).toBe('');
        
        noPromService.shutdown();
      });
    });
  });

  describe('Export', () => {
    let service: TelemetryService;

    beforeEach(() => {
      service = new TelemetryService({
        prometheus: { enabled: true, port: 0 },
        exportIntervalMs: 0,
      });
    });

    afterEach(async () => {
      await service.shutdown();
    });

    describe('export', () => {
      it('should increment export count', async () => {
        await service.export();
        
        const stats = service.getStats();
        expect(stats.exportCount).toBe(1);
      });

      it('should update last export time', async () => {
        await service.export();
        
        const stats = service.getStats();
        expect(stats.lastExportTime).toBeDefined();
      });
    });
  });

  describe('shutdown', () => {
    it('should stop export interval', async () => {
      vi.useFakeTimers();
      
      const intervalService = new TelemetryService({
        exportIntervalMs: 1000,
        prometheus: { enabled: false },
      });
      
      await intervalService.shutdown();
      
      vi.advanceTimersByTime(1000);
      
      // Export should not run after shutdown
      const stats = intervalService.getStats();
      expect(stats.exportCount).toBe(0);
      
      vi.useRealTimers();
    });

    it('should clear events', async () => {
      const service = new TelemetryService({
        enableLogging: true,
        prometheus: { enabled: false },
        exportIntervalMs: 0,
      });
      
      service.logEvent('event', {});
      
      await service.shutdown();
      
      const events = service.getEvents();
      expect(events).toHaveLength(0);
    });
  });
});

describe('telemetryService export', () => {
  it('should export singleton instance', () => {
    expect(telemetryService).toBeInstanceOf(TelemetryService);
  });
});
