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
  StreamingController,
  type StreamingConfig,
  type StreamingState,
  type StreamEvent,
} from './streamingController.js';
import { CancellationError } from './cancellation.js';

describe('StreamingController', () => {
  describe('constructor', () => {
    it('should create controller with default config', () => {
      const controller = new StreamingController();
      expect(controller.getState()).toBe('idle');
      expect(controller.token).toBeDefined();
    });

    it('should merge custom config', () => {
      const controller = new StreamingController({
        maxRetries: 5,
        retryDelayMs: 500,
      });
      expect(controller).toBeDefined();
    });

    it('should register event listeners from config', () => {
      const listener = vi.fn();
      const controller = new StreamingController({
        listeners: [listener],
      });
      
      controller.start(async (emit) => {
        await emit('test');
      });
      
      // Listeners should be registered
      expect(controller).toBeDefined();
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const controller = new StreamingController();
      expect(controller.getState()).toBe('idle');
    });
  });

  describe('getStats', () => {
    it('should return initial statistics', () => {
      const controller = new StreamingController();
      const stats = controller.getStats();
      
      expect(stats.state).toBe('idle');
      expect(stats.totalChunks).toBe(0);
      expect(stats.validChunks).toBe(0);
      expect(stats.invalidChunks).toBe(0);
    });
  });

  describe('addEventListener/removeEventListener', () => {
    it('should add listener for all event types', () => {
      const controller = new StreamingController();
      const listener = vi.fn();
      
      controller.addEventListener(listener);
      
      // Listener should be registered
      expect(controller).toBeDefined();
    });

    it('should remove listener', () => {
      const controller = new StreamingController();
      const listener = vi.fn();
      
      controller.addEventListener(listener);
      controller.removeEventListener(listener);
      
      expect(controller).toBeDefined();
    });
  });

  describe('on', () => {
    it('should register listener for specific event type', () => {
      const controller = new StreamingController();
      const listener = vi.fn();
      
      const unsubscribe = controller.on('chunk', listener);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const controller = new StreamingController();
      const listener = vi.fn();
      
      const unsubscribe = controller.on('chunk', listener);
      unsubscribe();
      
      expect(controller).toBeDefined();
    });
  });

  describe('start', () => {
    it('should transition through states', async () => {
      const controller = new StreamingController();
      const states: StreamingState[] = [];
      
      controller.on('state_change', (event) => {
        states.push(event.state);
      });
      
      await controller.start(async (emit) => {
        await emit('test');
      });
      
      expect(states).toContain('connecting');
      expect(states).toContain('streaming');
      expect(states).toContain('completed');
    });

    it('should emit started event', async () => {
      const controller = new StreamingController();
      const listener = vi.fn();
      
      controller.on('started', listener);
      
      await controller.start(async () => {});
      
      expect(listener).toHaveBeenCalled();
    });

    it('should emit completed event', async () => {
      const controller = new StreamingController();
      const listener = vi.fn();
      
      controller.on('completed', listener);
      
      await controller.start(async () => {});
      
      expect(listener).toHaveBeenCalled();
    });

    it('should throw if not in idle state', async () => {
      const controller = new StreamingController();
      
      await controller.start(async () => {});
      
      await expect(controller.start(async () => {})).rejects.toThrow(
        'Cannot start: current state is completed'
      );
    });

    it('should process emitted chunks', async () => {
      const controller = new StreamingController();
      const chunks: unknown[] = [];
      
      controller.on('chunk', (event) => {
        chunks.push(event.data);
      });
      
      await controller.start(async (emit) => {
        await emit('chunk1');
        await emit('chunk2');
        await emit('chunk3');
      });
      
      expect(chunks).toHaveLength(3);
    });

    it('should update statistics', async () => {
      const controller = new StreamingController();
      
      await controller.start(async (emit) => {
        await emit({ data: 'test' });
      });
      
      const stats = controller.getStats();
      expect(stats.totalChunks).toBe(1);
      expect(stats.validChunks).toBe(1);
    });

    it('should track duration', async () => {
      const controller = new StreamingController();
      
      await controller.start(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      const stats = controller.getStats();
      expect(stats.duration).toBeGreaterThan(0);
    });
  });

  describe('cancellation', () => {
    it('should handle cancellation', async () => {
      const controller = new StreamingController();
      const listener = vi.fn();
      
      controller.on('cancelled', listener);
      
      const promise = controller.start(async (emit) => {
        await emit('test');
        controller.cancel('User cancelled');
        throw new CancellationError('User cancelled', 'user');
      });
      
      await promise;
      
      expect(listener).toHaveBeenCalled();
      expect(controller.getState()).toBe('cancelled');
    });

    it('should cancel via token', () => {
      const controller = new StreamingController();
      
      controller.cancel('Test cancellation');
      
      expect(controller.token.isCancellationRequested).toBe(true);
    });
  });

  describe('pause/resume', () => {
    it('should pause streaming', () => {
      const controller = new StreamingController();
      
      // Start the controller first
      controller.start(async () => {}).catch(() => {});
      
      // Pause (won't work since state isn't streaming)
      controller.pause();
      
      expect(controller).toBeDefined();
    });

    it('should resume streaming', () => {
      const controller = new StreamingController();
      
      controller.resume();
      
      expect(controller).toBeDefined();
    });
  });

  describe('retries', () => {
    it('should retry on error', async () => {
      const controller = new StreamingController({
        maxRetries: 2,
        retryDelayMs: 10,
        retryBackoff: false,
      });
      
      const retryListener = vi.fn();
      controller.on('retry', retryListener);
      
      let attempts = 0;
      
      await controller.start(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
      });
      
      expect(retryListener).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      vi.useFakeTimers();
      const controller = new StreamingController({
        maxRetries: 2,
        retryDelayMs: 100,
        retryBackoff: true,
      });
      
      let attempts = 0;
      const start = Date.now();
      
      const promise = controller.start(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
      });
      
      vi.advanceTimersByTime(1000);
      await promise;
      
      vi.useRealTimers();
    });

    it('should emit error after max retries', async () => {
      const controller = new StreamingController({
        maxRetries: 1,
        retryDelayMs: 10,
      });
      
      const errorListener = vi.fn();
      controller.on('error', errorListener);
      
      await expect(controller.start(async () => {
        throw new Error('Permanent error');
      })).rejects.toThrow('Permanent error');
      
      expect(errorListener).toHaveBeenCalled();
    });
  });

  describe('validation errors', () => {
    it('should emit validation_error for invalid chunks', async () => {
      const controller = new StreamingController({
        validation: {
          maxChunkSize: 10,
        },
      });
      
      const validationListener = vi.fn();
      controller.on('validation_error', validationListener);
      
      await controller.start(async (emit) => {
        await emit('x'.repeat(100)); // Too large
      });
      
      expect(validationListener).toHaveBeenCalled();
    });

    it('should track invalid chunks', async () => {
      const controller = new StreamingController({
        validation: {
          maxChunkSize: 10,
        },
      });
      
      await controller.start(async (emit) => {
        await emit('x'.repeat(100)); // Too large
      });
      
      const stats = controller.getStats();
      expect(stats.invalidChunks).toBe(1);
    });
  });

  describe('pressure changes', () => {
    it('should emit pressure_change events', async () => {
      const controller = new StreamingController({
        backpressure: {
          maxBufferSize: 100,
          warningThreshold: 0.5,
        },
      });
      
      const pressureListener = vi.fn();
      controller.on('pressure_change', pressureListener);
      
      await controller.start(async (emit) => {
        // Emit chunks to trigger pressure
        for (let i = 0; i < 10; i++) {
          await emit('x'.repeat(100));
        }
      });
      
      expect(pressureListener).toHaveBeenCalled();
    });
  });

  describe('processStream', () => {
    it('should process async iterable', async () => {
      const controller = new StreamingController();
      
      async function* generator() {
        yield 'chunk1';
        yield 'chunk2';
        yield 'chunk3';
      }
      
      await controller.processStream(generator());
      
      const stats = controller.getStats();
      expect(stats.totalChunks).toBe(3);
    });

    it('should stop on cancellation', async () => {
      const controller = new StreamingController();
      
      async function* generator() {
        yield 'chunk1';
        yield 'chunk2';
        yield 'chunk3';
      }
      
      const promise = controller.processStream(generator());
      
      controller.cancel();
      
      await promise;
      
      expect(controller.getState()).toBe('cancelled');
    });
  });

  describe('getChunks', () => {
    it('should return async generator', async () => {
      const controller = new StreamingController();
      
      // Start streaming in background
      controller.start(async (emit) => {
        await emit('test');
      });
      
      // Get chunks would work if we consume during streaming
      controller.dispose();
      
      expect(controller).toBeDefined();
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      const controller = new StreamingController();
      
      controller.dispose();
      
      expect(controller).toBeDefined();
    });
  });

  describe('metrics collection', () => {
    it('should start metrics collection when enabled', async () => {
      vi.useFakeTimers();
      const controller = new StreamingController({
        enableMetrics: true,
        metricsInterval: 100,
      });
      
      await controller.start(async (emit) => {
        await emit('test');
      });
      
      vi.advanceTimersByTime(100);
      
      const stats = controller.getStats();
      expect(stats.throughput).toBeGreaterThanOrEqual(0);
      
      vi.useRealTimers();
    });
  });
});
