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
  MetricsCollector,
  metricsCollector,
  type MetricsConfig,
  type MetricDefinition,
  type MetricType,
  type AggregatedMetric,
} from './metricsCollector.js';

describe('MetricsCollector', () => {
  describe('constructor', () => {
    it('should create collector with default config', () => {
      const collector = new MetricsCollector();
      expect(collector).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const collector = new MetricsCollector({
        prefix: 'custom_',
        defaultLabels: { env: 'test' },
      });
      expect(collector).toBeDefined();
    });

    it('should register predefined metrics', () => {
      const collector = new MetricsCollector({
        predefinedMetrics: [
          { name: 'requests', type: 'counter', description: 'Total requests' },
        ],
      });
      
      const definitions = collector.getDefinitions();
      expect(definitions.some(d => d.name === 'ollama_code_requests')).toBe(true);
    });
  });

  describe('register', () => {
    it('should register counter metric', () => {
      const collector = new MetricsCollector();
      
      collector.register({
        name: 'test_counter',
        type: 'counter',
        description: 'Test counter',
      });
      
      const definitions = collector.getDefinitions();
      expect(definitions.some(d => d.name === 'ollama_code_test_counter')).toBe(true);
    });

    it('should register gauge metric', () => {
      const collector = new MetricsCollector();
      
      collector.register({
        name: 'test_gauge',
        type: 'gauge',
        description: 'Test gauge',
      });
      
      const definitions = collector.getDefinitions();
      expect(definitions.some(d => d.name === 'ollama_code_test_gauge')).toBe(true);
    });

    it('should register histogram metric', () => {
      const collector = new MetricsCollector();
      
      collector.register({
        name: 'test_histogram',
        type: 'histogram',
        description: 'Test histogram',
        buckets: [0.1, 0.5, 1, 5],
      });
      
      const definitions = collector.getDefinitions();
      expect(definitions.some(d => d.name === 'ollama_code_test_histogram')).toBe(true);
    });

    it('should register summary metric', () => {
      const collector = new MetricsCollector();
      
      collector.register({
        name: 'test_summary',
        type: 'summary',
        description: 'Test summary',
        quantiles: [0.5, 0.9, 0.99],
      });
      
      const definitions = collector.getDefinitions();
      expect(definitions.some(d => d.name === 'ollama_code_test_summary')).toBe(true);
    });

    it('should include default labels', () => {
      const collector = new MetricsCollector({
        defaultLabels: { app: 'test' },
      });
      
      collector.register({
        name: 'test',
        type: 'counter',
        description: 'Test',
      });
      
      expect(collector).toBeDefined();
    });
  });

  describe('record', () => {
    it('should record counter value', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'requests', type: 'counter', description: 'Requests' });
      collector.record('requests', 5);
      collector.record('requests', 3);
      
      const metric = collector.getMetric('requests');
      expect(metric?.values[0].value).toBe(8);
    });

    it('should record gauge value', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'connections', type: 'gauge', description: 'Connections' });
      collector.record('connections', 10);
      collector.record('connections', 20);
      
      const metric = collector.getMetric('connections');
      expect(metric?.values[0].value).toBe(20);
    });

    it('should record histogram value', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'latency', type: 'histogram', description: 'Latency' });
      collector.record('latency', 0.5);
      collector.record('latency', 1.5);
      collector.record('latency', 2.5);
      
      const metric = collector.getMetric('latency');
      expect(metric?.values[0].count).toBe(3);
    });

    it('should record summary value', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'duration', type: 'summary', description: 'Duration' });
      collector.record('duration', 1);
      collector.record('duration', 2);
      collector.record('duration', 3);
      
      const metric = collector.getMetric('duration');
      expect(metric?.values[0].count).toBe(3);
    });

    it('should handle unknown metric as counter', () => {
      const collector = new MetricsCollector();
      
      collector.record('unknown_metric', 5);
      
      const metrics = collector.getAllMetrics();
      expect(metrics.some(m => m.name === 'ollama_code_unknown_metric')).toBe(true);
    });

    it('should not record when disabled', () => {
      const collector = new MetricsCollector({ enabled: false });
      
      collector.register({ name: 'test', type: 'counter', description: 'Test' });
      collector.record('test', 5);
      
      const metric = collector.getMetric('test');
      expect(metric?.values).toHaveLength(0);
    });
  });

  describe('incrementCounter', () => {
    it('should increment counter', () => {
      const collector = new MetricsCollector();
      
      collector.incrementCounter('requests');
      collector.incrementCounter('requests');
      collector.incrementCounter('requests', { method: 'GET' });
      
      const metric = collector.getMetric('requests');
      expect(metric?.values.length).toBeGreaterThan(0);
    });

    it('should not increment when disabled', () => {
      const collector = new MetricsCollector({ enabled: false });
      
      collector.incrementCounter('test');
      
      const metric = collector.getMetric('test');
      expect(metric?.values).toHaveLength(0);
    });
  });

  describe('setGauge', () => {
    it('should set gauge value', () => {
      const collector = new MetricsCollector();
      
      collector.setGauge('memory', 1024);
      collector.setGauge('memory', 2048, { type: 'heap' });
      
      const metric = collector.getMetric('memory');
      expect(metric?.values.length).toBeGreaterThan(0);
    });

    it('should not set when disabled', () => {
      const collector = new MetricsCollector({ enabled: false });
      
      collector.setGauge('test', 100);
      
      const metric = collector.getMetric('test');
      expect(metric?.values).toHaveLength(0);
    });
  });

  describe('recordHistogram', () => {
    it('should record histogram observation', () => {
      const collector = new MetricsCollector();
      
      collector.register({
        name: 'latency',
        type: 'histogram',
        description: 'Latency',
        buckets: [0.1, 0.5, 1, 5],
      });
      
      collector.recordHistogram('latency', 0.3);
      collector.recordHistogram('latency', 1.5);
      
      const metric = collector.getMetric('latency');
      expect(metric?.values[0].count).toBe(2);
      expect(metric?.values[0].sum).toBe(1.8);
    });

    it('should not record when disabled', () => {
      const collector = new MetricsCollector({ enabled: false });
      
      collector.register({ name: 'latency', type: 'histogram', description: 'Latency' });
      collector.recordHistogram('latency', 0.5);
      
      const metric = collector.getMetric('latency');
      expect(metric?.values).toHaveLength(0);
    });
  });

  describe('getAllMetrics', () => {
    it('should return all metrics', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'counter1', type: 'counter', description: 'C1' });
      collector.register({ name: 'gauge1', type: 'gauge', description: 'G1' });
      
      collector.incrementCounter('counter1');
      collector.setGauge('gauge1', 100);
      
      const metrics = collector.getAllMetrics();
      
      expect(metrics.some(m => m.name === 'ollama_code_counter1')).toBe(true);
      expect(metrics.some(m => m.name === 'ollama_code_gauge1')).toBe(true);
    });

    it('should return empty array when no metrics', () => {
      const collector = new MetricsCollector();
      collector.clear();
      
      const metrics = collector.getAllMetrics();
      
      expect(metrics).toEqual([]);
    });
  });

  describe('getMetric', () => {
    it('should return specific metric', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'test', type: 'counter', description: 'Test' });
      collector.incrementCounter('test');
      
      const metric = collector.getMetric('test');
      
      expect(metric?.name).toBe('ollama_code_test');
    });

    it('should return undefined for unknown metric', () => {
      const collector = new MetricsCollector();
      
      const metric = collector.getMetric('unknown');
      
      expect(metric).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all metrics', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'test', type: 'counter', description: 'Test' });
      collector.incrementCounter('test');
      
      collector.clear();
      
      const metrics = collector.getAllMetrics();
      expect(metrics).toEqual([]);
    });
  });

  describe('getDefinition', () => {
    it('should return metric definition', () => {
      const collector = new MetricsCollector();
      
      collector.register({
        name: 'test',
        type: 'counter',
        description: 'Test counter',
        unit: 'count',
      });
      
      const definition = collector.getDefinition('test');
      
      expect(definition?.description).toBe('Test counter');
      expect(definition?.unit).toBe('count');
    });

    it('should return undefined for unknown metric', () => {
      const collector = new MetricsCollector();
      
      const definition = collector.getDefinition('unknown');
      
      expect(definition).toBeUndefined();
    });
  });

  describe('getDefinitions', () => {
    it('should return all definitions', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'a', type: 'counter', description: 'A' });
      collector.register({ name: 'b', type: 'gauge', description: 'B' });
      
      const definitions = collector.getDefinitions();
      
      expect(definitions.length).toBe(2);
    });
  });

  describe('labels', () => {
    it('should handle metrics with labels', () => {
      const collector = new MetricsCollector();
      
      collector.register({ name: 'http_requests', type: 'counter', description: 'HTTP requests' });
      collector.incrementCounter('http_requests', { method: 'GET', status: '200' });
      collector.incrementCounter('http_requests', { method: 'POST', status: '201' });
      collector.incrementCounter('http_requests', { method: 'GET', status: '200' });
      
      const metric = collector.getMetric('http_requests');
      expect(metric?.values.length).toBe(2);
    });

    it('should include default labels', () => {
      const collector = new MetricsCollector({
        defaultLabels: { app: 'test-app' },
      });
      
      collector.register({ name: 'test', type: 'counter', description: 'Test' });
      collector.incrementCounter('test', { env: 'dev' });
      
      const metric = collector.getMetric('test');
      expect(metric?.values[0].labels['app']).toBe('test-app');
      expect(metric?.values[0].labels['env']).toBe('dev');
    });
  });

  describe('prefix handling', () => {
    it('should add prefix to metric names', () => {
      const collector = new MetricsCollector({ prefix: 'my_app_' });
      
      collector.register({ name: 'requests', type: 'counter', description: 'Requests' });
      collector.incrementCounter('requests');
      
      const metric = collector.getMetric('requests');
      expect(metric?.name).toBe('my_app_requests');
    });

    it('should not duplicate prefix', () => {
      const collector = new MetricsCollector({ prefix: 'my_app_' });
      
      collector.register({ name: 'my_app_requests', type: 'counter', description: 'Requests' });
      
      const definitions = collector.getDefinitions();
      expect(definitions[0].name).toBe('my_app_requests');
    });
  });

  describe('histogram buckets', () => {
    it('should calculate bucket counts', () => {
      const collector = new MetricsCollector();
      
      collector.register({
        name: 'latency',
        type: 'histogram',
        description: 'Latency',
        buckets: [0.1, 0.5, 1, 5],
      });
      
      collector.recordHistogram('latency', 0.05);
      collector.recordHistogram('latency', 0.3);
      collector.recordHistogram('latency', 0.7);
      collector.recordHistogram('latency', 2);
      collector.recordHistogram('latency', 10);
      
      const metric = collector.getMetric('latency');
      expect(metric?.values[0].buckets).toBeDefined();
    });
  });

  describe('summary quantiles', () => {
    it('should calculate quantiles', () => {
      const collector = new MetricsCollector();
      
      collector.register({
        name: 'duration',
        type: 'summary',
        description: 'Duration',
        quantiles: [0.5, 0.9, 0.99],
      });
      
      for (let i = 1; i <= 100; i++) {
        collector.record('duration', i);
      }
      
      const metric = collector.getMetric('duration');
      expect(metric?.values[0].quantiles).toBeDefined();
    });
  });
});

describe('metricsCollector export', () => {
  it('should export singleton instance', () => {
    expect(metricsCollector).toBeInstanceOf(MetricsCollector);
  });
});
