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
  Tracer,
  tracer,
  Span,
  SpanContext,
  type TracerConfig,
  type SpanKind,
  type SpanStatus,
  type CompletedSpan,
} from './tracer.js';

describe('SpanContext', () => {
  describe('constructor', () => {
    it('should create context with trace and span IDs', () => {
      const context = new SpanContext('trace123', 'span456');
      
      expect(context.traceId).toBe('trace123');
      expect(context.spanId).toBe('span456');
      expect(context.traceFlags).toBe(1);
    });

    it('should accept custom trace flags and state', () => {
      const context = new SpanContext('trace123', 'span456', 0, 'state');
      
      expect(context.traceFlags).toBe(0);
      expect(context.traceState).toBe('state');
    });
  });

  describe('fromString', () => {
    it('should parse valid string', () => {
      const context = SpanContext.fromString('trace123-span456-1');
      
      expect(context?.traceId).toBe('trace123');
      expect(context?.spanId).toBe('span456');
      expect(context?.traceFlags).toBe(1);
    });

    it('should use default trace flags if not provided', () => {
      const context = SpanContext.fromString('trace123-span456');
      
      expect(context?.traceFlags).toBe(1);
    });

    it('should return null for invalid string', () => {
      const context = SpanContext.fromString('invalid');
      
      expect(context).toBeNull();
    });
  });

  describe('toString', () => {
    it('should format context as string', () => {
      const context = new SpanContext('trace123', 'span456', 1);
      
      expect(context.toString()).toBe('trace123-span456-1');
    });
  });

  describe('isValid', () => {
    it('should return true for valid context', () => {
      const context = new SpanContext(
        '0123456789abcdef0123456789abcdef',
        '0123456789abcdef'
      );
      
      expect(context.isValid()).toBe(true);
    });

    it('should return false for invalid trace ID length', () => {
      const context = new SpanContext('short', '0123456789abcdef');
      
      expect(context.isValid()).toBe(false);
    });

    it('should return false for invalid span ID length', () => {
      const context = new SpanContext(
        '0123456789abcdef0123456789abcdef',
        'short'
      );
      
      expect(context.isValid()).toBe(false);
    });

    it('should return false for non-hex characters', () => {
      const context = new SpanContext(
        'ghijklmnopqrstuv0123456789abcdef',
        '0123456789abcdef'
      );
      
      expect(context.isValid()).toBe(false);
    });
  });
});

describe('Span', () => {
  let tracer: Tracer;

  beforeEach(() => {
    tracer = new Tracer();
  });

  describe('constructor', () => {
    it('should create span with name', () => {
      const span = tracer.startSpan('test-span');
      
      expect(span.name).toBe('test-span');
      expect(span.traceId).toBeDefined();
      expect(span.spanId).toBeDefined();
    });

    it('should accept custom options', () => {
      const span = tracer.startSpan('test-span', {
        kind: 'client',
        attributes: { key: 'value' },
      });
      
      expect(span.kind).toBe('client');
    });

    it('should accept parent context', () => {
      const parent = tracer.startSpan('parent');
      const child = tracer.startSpan('child', { parent: parent.context });
      
      expect(child.parentSpanId).toBe(parent.spanId);
      expect(child.traceId).toBe(parent.traceId);
    });
  });

  describe('setAttribute', () => {
    it('should set attribute', () => {
      const span = tracer.startSpan('test');
      
      span.setAttribute('key', 'value');
      
      const completed = span.toCompletedSpan();
      expect(completed.attributes['key']).toBe('value');
    });

    it('should truncate long string values', () => {
      const tracerWithLimits = new Tracer({
        attributeLimits: { count: 10, valueLength: 10 },
      });
      const span = tracerWithLimits.startSpan('test');
      
      span.setAttribute('key', 'a'.repeat(100));
      
      const completed = span.toCompletedSpan();
      expect((completed.attributes['key'] as string).length).toBe(10);
    });

    it('should not set attribute after end', () => {
      const span = tracer.startSpan('test');
      span.end();
      
      span.setAttribute('key', 'value');
      
      const completed = span.toCompletedSpan();
      expect(completed.attributes['key']).toBeUndefined();
    });

    it('should drop attributes when limit reached', () => {
      const tracerWithLimits = new Tracer({
        attributeLimits: { count: 2, valueLength: 100 },
      });
      const span = tracerWithLimits.startSpan('test');
      
      span.setAttribute('key1', 'value1');
      span.setAttribute('key2', 'value2');
      span.setAttribute('key3', 'value3');
      
      const completed = span.toCompletedSpan();
      expect(Object.keys(completed.attributes).length).toBe(2);
    });
  });

  describe('setAttributes', () => {
    it('should set multiple attributes', () => {
      const span = tracer.startSpan('test');
      
      span.setAttributes({ key1: 'value1', key2: 'value2' });
      
      const completed = span.toCompletedSpan();
      expect(completed.attributes['key1']).toBe('value1');
      expect(completed.attributes['key2']).toBe('value2');
    });
  });

  describe('addEvent', () => {
    it('should add event', () => {
      const span = tracer.startSpan('test');
      
      span.addEvent('event-name', { attr: 'value' });
      
      const completed = span.toCompletedSpan();
      expect(completed.events).toHaveLength(1);
      expect(completed.events[0].name).toBe('event-name');
    });

    it('should limit event attributes', () => {
      const tracerWithLimits = new Tracer({
        eventLimits: { count: 10, attributeCount: 1 },
      });
      const span = tracerWithLimits.startSpan('test');
      
      span.addEvent('event', { attr1: 'value1', attr2: 'value2' });
      
      const completed = span.toCompletedSpan();
      expect(Object.keys(completed.events[0].attributes || {}).length).toBe(1);
    });

    it('should not add event after end', () => {
      const span = tracer.startSpan('test');
      span.end();
      
      span.addEvent('event');
      
      const completed = span.toCompletedSpan();
      expect(completed.events).toHaveLength(0);
    });

    it('should drop events when limit reached', () => {
      const tracerWithLimits = new Tracer({
        eventLimits: { count: 1, attributeCount: 10 },
      });
      const span = tracerWithLimits.startSpan('test');
      
      span.addEvent('event1');
      span.addEvent('event2');
      
      const completed = span.toCompletedSpan();
      expect(completed.events).toHaveLength(1);
    });
  });

  describe('setStatus', () => {
    it('should set status', () => {
      const span = tracer.startSpan('test');
      
      span.setStatus({ code: 'ok' });
      
      const completed = span.toCompletedSpan();
      expect(completed.status.code).toBe('ok');
    });

    it('should not set status after end', () => {
      const span = tracer.startSpan('test');
      span.end();
      
      span.setStatus({ code: 'error' });
      
      const completed = span.toCompletedSpan();
      expect(completed.status.code).toBe('unset');
    });
  });

  describe('recordException', () => {
    it('should record exception as event', () => {
      const span = tracer.startSpan('test');
      const error = new Error('Test error');
      
      span.recordException(error);
      
      const completed = span.toCompletedSpan();
      expect(completed.events).toHaveLength(1);
      expect(completed.events[0].name).toBe('exception');
      expect(completed.events[0].attributes?.['exception.type']).toBe('Error');
      expect(completed.events[0].attributes?.['exception.message']).toBe('Test error');
    });

    it('should set error status', () => {
      const span = tracer.startSpan('test');
      const error = new Error('Test error');
      
      span.recordException(error);
      
      const completed = span.toCompletedSpan();
      expect(completed.status.code).toBe('error');
      expect(completed.status.message).toBe('Test error');
    });

    it('should not record exception after end', () => {
      const span = tracer.startSpan('test');
      span.end();
      
      span.recordException(new Error('Test'));
      
      const completed = span.toCompletedSpan();
      expect(completed.events).toHaveLength(0);
    });
  });

  describe('end', () => {
    it('should end the span', () => {
      const span = tracer.startSpan('test');
      
      span.end();
      
      expect(span.isEnded()).toBe(true);
    });

    it('should accept custom end time', () => {
      const span = tracer.startSpan('test');
      const customTime = Date.now() + 1000;
      
      span.end(customTime);
      
      const completed = span.toCompletedSpan();
      expect(completed.endTime).toBe(customTime);
    });

    it('should be idempotent', () => {
      const span = tracer.startSpan('test');
      
      span.end();
      span.end();
      
      expect(span.isEnded()).toBe(true);
    });

    it('should add dropped counts as attributes', () => {
      const tracerWithLimits = new Tracer({
        attributeLimits: { count: 1, valueLength: 100 },
      });
      const span = tracerWithLimits.startSpan('test');
      
      span.setAttribute('key1', 'value1');
      span.setAttribute('key2', 'value2');
      span.end();
      
      const completed = span.toCompletedSpan();
      expect(completed.attributes['otel.dropped_attributes_count']).toBe(1);
    });
  });

  describe('duration', () => {
    it('should calculate duration', async () => {
      const span = tracer.startSpan('test');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      span.end();
      
      expect(span.duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('startChild', () => {
    it('should create child span', () => {
      const parent = tracer.startSpan('parent');
      const child = parent.startChild('child');
      
      expect(child.parentSpanId).toBe(parent.spanId);
      expect(child.traceId).toBe(parent.traceId);
    });
  });

  describe('toCompletedSpan', () => {
    it('should convert to completed span', () => {
      const span = tracer.startSpan('test', {
        kind: 'server',
        attributes: { key: 'value' },
      });
      
      span.addEvent('event');
      span.setStatus({ code: 'ok' });
      span.end();
      
      const completed = span.toCompletedSpan();
      
      expect(completed.name).toBe('test');
      expect(completed.kind).toBe('server');
      expect(completed.status.code).toBe('ok');
      expect(completed.events).toHaveLength(1);
    });
  });
});

describe('Tracer', () => {
  describe('constructor', () => {
    it('should create tracer with default config', () => {
      const tracer = new Tracer();
      expect(tracer).toBeDefined();
    });

    it('should merge custom config', () => {
      const tracer = new Tracer({
        serviceName: 'test-service',
        samplingRate: 0.5,
      });
      expect(tracer).toBeDefined();
    });
  });

  describe('getConfig', () => {
    it('should return configuration', () => {
      const tracer = new Tracer({ serviceName: 'test-service' });
      
      const config = tracer.getConfig();
      
      expect(config.serviceName).toBe('test-service');
    });
  });

  describe('startSpan', () => {
    it('should create and track span', () => {
      const tracer = new Tracer();
      
      const span = tracer.startSpan('test');
      
      expect(span).toBeDefined();
      expect(tracer.getActiveSpanCount()).toBe(1);
    });

    it('should respect sampling rate', () => {
      const tracer = new Tracer({ samplingRate: 0 });
      
      const span = tracer.startSpan('test');
      
      // With 0 sampling rate, should return NoopSpan
      expect(span.isEnded()).toBe(true);
    });

    it('should respect max spans per trace', () => {
      const tracer = new Tracer({ maxSpansPerTrace: 2 });
      
      tracer.startSpan('span1');
      tracer.startSpan('span2');
      const span3 = tracer.startSpan('span3');
      
      // Third span should be NoopSpan
      expect(span3.isEnded()).toBe(true);
    });

    it('should create noop span when noop option is true', () => {
      const tracer = new Tracer();
      
      const span = tracer.startSpan('test', { noop: true });
      
      expect(span.isEnded()).toBe(true);
    });
  });

  describe('getActiveSpan', () => {
    it('should return most recent span when no ID provided', () => {
      const tracer = new Tracer();
      
      const span1 = tracer.startSpan('span1');
      const span2 = tracer.startSpan('span2');
      
      const active = tracer.getActiveSpan();
      
      expect(active?.spanId).toBe(span2.spanId);
    });

    it('should return specific span when ID provided', () => {
      const tracer = new Tracer();
      
      const span1 = tracer.startSpan('span1');
      const span2 = tracer.startSpan('span2');
      
      const active = tracer.getActiveSpan(span1.spanId);
      
      expect(active?.spanId).toBe(span1.spanId);
    });

    it('should return undefined when no spans active', () => {
      const tracer = new Tracer();
      
      const active = tracer.getActiveSpan();
      
      expect(active).toBeUndefined();
    });
  });

  describe('getActiveSpanCount', () => {
    it('should count active spans', () => {
      const tracer = new Tracer();
      
      tracer.startSpan('span1');
      tracer.startSpan('span2');
      
      expect(tracer.getActiveSpanCount()).toBe(2);
    });
  });

  describe('getCompletedSpans', () => {
    it('should return completed spans', () => {
      const tracer = new Tracer();
      
      const span = tracer.startSpan('test');
      span.end();
      
      const completed = tracer.getCompletedSpans();
      
      expect(completed).toHaveLength(1);
      expect(completed[0].name).toBe('test');
    });
  });

  describe('clearCompletedSpans', () => {
    it('should clear completed spans', () => {
      const tracer = new Tracer();
      
      const span = tracer.startSpan('test');
      span.end();
      
      tracer.clearCompletedSpans();
      
      expect(tracer.getCompletedSpans()).toHaveLength(0);
    });
  });

  describe('export', () => {
    it('should export and clear spans', () => {
      const tracer = new Tracer();
      
      const span = tracer.startSpan('test');
      span.end();
      
      const exported = tracer.export();
      
      expect(exported).toHaveLength(1);
      expect(tracer.getCompletedSpans()).toHaveLength(0);
    });
  });

  describe('onSpanEnd', () => {
    it('should call callback when span ends', () => {
      const onSpanEnd = vi.fn();
      const tracer = new Tracer({ onSpanEnd });
      
      const span = tracer.startSpan('test');
      span.end();
      
      expect(onSpanEnd).toHaveBeenCalled();
    });

    it('should remove span from active spans', () => {
      const tracer = new Tracer();
      
      const span = tracer.startSpan('test');
      span.end();
      
      expect(tracer.getActiveSpanCount()).toBe(0);
    });
  });
});

describe('tracer export', () => {
  it('should export singleton instance', () => {
    expect(tracer).toBeInstanceOf(Tracer);
  });
});
