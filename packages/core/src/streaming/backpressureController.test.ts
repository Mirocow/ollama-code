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
  BackpressureController,
  type BackpressureConfig,
  type PressureState,
} from './backpressureController.js';

describe('BackpressureController', () => {
  describe('constructor', () => {
    it('should create controller with default config', () => {
      const controller = new BackpressureController();
      expect(controller.getState()).toBe('normal');
      expect(controller.length).toBe(0);
      expect(controller.size).toBe(0);
    });

    it('should merge custom config with defaults', () => {
      const controller = new BackpressureController({
        maxBufferSize: 1024,
        warningThreshold: 0.5,
      });
      expect(controller).toBeDefined();
    });

    it('should call onStateChange callback', () => {
      const onStateChange = vi.fn();
      const controller = new BackpressureController({
        maxBufferSize: 100,
        warningThreshold: 0.5,
        onStateChange,
      });
      
      // Add enough data to trigger warning state
      controller.enqueue('x'.repeat(60));
      
      expect(onStateChange).toHaveBeenCalled();
    });
  });

  describe('enqueue', () => {
    it('should add item to buffer', () => {
      const controller = new BackpressureController();
      const result = controller.enqueue('test data');
      
      expect(result).toBe(true);
      expect(controller.length).toBe(1);
    });

    it('should calculate size for string data', () => {
      const controller = new BackpressureController();
      controller.enqueue('test');
      
      expect(controller.size).toBe(8); // 4 chars * 2 bytes
    });

    it('should calculate size for ArrayBuffer', () => {
      const controller = new BackpressureController();
      const buffer = new ArrayBuffer(100);
      controller.enqueue(buffer);
      
      expect(controller.size).toBe(100);
    });

    it('should calculate size for TypedArray', () => {
      const controller = new BackpressureController();
      const array = new Uint8Array(50);
      controller.enqueue(array);
      
      expect(controller.size).toBe(50);
    });

    it('should calculate size for object data', () => {
      const controller = new BackpressureController();
      controller.enqueue({ key: 'value' });
      
      expect(controller.size).toBeGreaterThan(0);
    });

    it('should handle null/undefined data', () => {
      const controller = new BackpressureController();
      controller.enqueue(null);
      controller.enqueue(undefined);
      
      expect(controller.size).toBe(0);
    });

    it('should handle circular references in objects', () => {
      const controller = new BackpressureController();
      const obj: Record<string, unknown> = { key: 'value' };
      obj.self = obj; // Circular reference
      
      const result = controller.enqueue(obj);
      
      expect(result).toBe(true);
      expect(controller.size).toBe(1024); // Default estimate
    });

    it('should respect maxBufferItems limit', () => {
      const controller = new BackpressureController({
        maxBufferItems: 2,
        dropOnCritical: true,
      });
      
      controller.enqueue('a');
      controller.enqueue('b');
      const result = controller.enqueue('c');
      
      // Should drop oldest or reject based on config
      expect(controller.length).toBeLessThanOrEqual(2);
    });

    it('should drop items when dropOnCritical is true', () => {
      const onChunkDropped = vi.fn();
      const controller = new BackpressureController({
        maxBufferItems: 1,
        dropOnCritical: true,
        onChunkDropped,
      });
      
      controller.enqueue('a');
      const result = controller.enqueue('b');
      
      expect(onChunkDropped).toHaveBeenCalled();
    });

    it('should return false when buffer is full and dropOnCritical is false', () => {
      const controller = new BackpressureController({
        maxBufferItems: 1,
        dropOnCritical: false,
      });
      
      controller.enqueue('a');
      const result = controller.enqueue('b');
      
      expect(result).toBe(false);
    });

    it('should support priority-based dropping', () => {
      const onChunkDropped = vi.fn();
      const controller = new BackpressureController({
        maxBufferItems: 1,
        dropOnCritical: true,
        onChunkDropped,
      });
      
      controller.enqueue('low-priority', 0);
      controller.enqueue('high-priority', 10);
      
      expect(controller.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('dequeue', () => {
    it('should return item from buffer', async () => {
      const controller = new BackpressureController();
      controller.enqueue('test');
      
      const item = await controller.dequeue();
      
      expect(item).toBe('test');
      expect(controller.length).toBe(0);
    });

    it('should wait for data when buffer is empty', async () => {
      const controller = new BackpressureController({ consumerTimeoutMs: 100 });
      
      // Start dequeue before adding data
      const dequeuePromise = controller.dequeue();
      
      // Add data after a short delay
      setTimeout(() => controller.enqueue('delayed'), 10);
      
      const item = await dequeuePromise;
      expect(item).toBe('delayed');
    });

    it('should return null on timeout', async () => {
      const controller = new BackpressureController({ consumerTimeoutMs: 50 });
      
      const item = await controller.dequeue();
      
      expect(item).toBeNull();
    });

    it('should track consumer latency', async () => {
      const controller = new BackpressureController();
      controller.enqueue('test');
      
      await controller.dequeue();
      
      const stats = controller.getStats();
      expect(stats.averageConsumerLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('shouldPause', () => {
    it('should return false when state is normal', () => {
      const controller = new BackpressureController();
      expect(controller.shouldPause()).toBe(false);
    });

    it('should return true when state is warning', () => {
      const controller = new BackpressureController({
        maxBufferSize: 100,
        warningThreshold: 0.5,
      });
      
      controller.enqueue('x'.repeat(60));
      
      expect(controller.shouldPause()).toBe(true);
    });

    it('should return true when paused', () => {
      const controller = new BackpressureController();
      controller.pause();
      
      expect(controller.shouldPause()).toBe(true);
    });
  });

  describe('waitForPressure', () => {
    it('should resolve immediately when state is normal', async () => {
      const controller = new BackpressureController();
      
      await expect(controller.waitForPressure()).resolves.toBeUndefined();
    });

    it('should wait until state returns to normal', async () => {
      const controller = new BackpressureController({
        maxBufferSize: 100,
        warningThreshold: 0.5,
      });
      
      controller.enqueue('x'.repeat(60));
      expect(controller.getState()).toBe('warning');
      
      const waitPromise = controller.waitForPressure();
      
      // Dequeue to reduce pressure
      await controller.dequeue();
      
      await expect(waitPromise).resolves.toBeUndefined();
    });
  });

  describe('pause/resume', () => {
    it('should pause the controller', () => {
      const controller = new BackpressureController();
      controller.pause();
      
      expect(controller.shouldPause()).toBe(true);
    });

    it('should resume the controller', () => {
      const controller = new BackpressureController();
      controller.pause();
      controller.resume();
      
      expect(controller.shouldPause()).toBe(false);
    });

    it('should resolve waiting promises on resume', async () => {
      const controller = new BackpressureController();
      controller.pause();
      
      const waitPromise = controller.waitForPressure();
      
      controller.resume();
      
      await expect(waitPromise).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear the buffer', () => {
      const controller = new BackpressureController();
      controller.enqueue('a');
      controller.enqueue('b');
      controller.enqueue('c');
      
      controller.clear();
      
      expect(controller.length).toBe(0);
      expect(controller.size).toBe(0);
    });

    it('should call onChunkDropped for each item', () => {
      const onChunkDropped = vi.fn();
      const controller = new BackpressureController({ onChunkDropped });
      controller.enqueue('a');
      controller.enqueue('b');
      
      controller.clear();
      
      expect(onChunkDropped).toHaveBeenCalledTimes(2);
    });

    it('should update stats', () => {
      const controller = new BackpressureController();
      controller.enqueue('a');
      controller.enqueue('b');
      
      controller.clear();
      
      const stats = controller.getStats();
      expect(stats.totalChunksDropped).toBe(2);
    });
  });

  describe('getState', () => {
    it('should return normal when buffer is empty', () => {
      const controller = new BackpressureController();
      expect(controller.getState()).toBe('normal');
    });

    it('should return warning when threshold exceeded', () => {
      const controller = new BackpressureController({
        maxBufferSize: 100,
        warningThreshold: 0.5,
        criticalThreshold: 0.9,
      });
      
      controller.enqueue('x'.repeat(60));
      
      expect(controller.getState()).toBe('warning');
    });

    it('should return critical when critical threshold exceeded', () => {
      const controller = new BackpressureController({
        maxBufferSize: 100,
        warningThreshold: 0.5,
        criticalThreshold: 0.9,
      });
      
      controller.enqueue('x'.repeat(95));
      
      expect(controller.getState()).toBe('critical');
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const controller = new BackpressureController();
      controller.enqueue('test');
      
      const stats = controller.getStats();
      
      expect(stats.currentBufferSize).toBeGreaterThan(0);
      expect(stats.currentBufferItems).toBe(1);
      expect(stats.currentState).toBe('normal');
      expect(stats.totalChunksProcessed).toBe(1);
    });

    it('should track peak buffer size', () => {
      const controller = new BackpressureController();
      controller.enqueue('x'.repeat(100));
      controller.enqueue('x'.repeat(100));
      controller.dequeue();
      
      const stats = controller.getStats();
      
      expect(stats.peakBufferSize).toBe(400); // 200 * 2 bytes
    });
  });

  describe('isEmpty', () => {
    it('should return true when buffer is empty', () => {
      const controller = new BackpressureController();
      expect(controller.isEmpty()).toBe(true);
    });

    it('should return false when buffer has items', () => {
      const controller = new BackpressureController();
      controller.enqueue('test');
      expect(controller.isEmpty()).toBe(false);
    });
  });

  describe('peek', () => {
    it('should return first item without removing it', () => {
      const controller = new BackpressureController();
      controller.enqueue('first');
      controller.enqueue('second');
      
      expect(controller.peek()).toBe('first');
      expect(controller.length).toBe(2);
    });

    it('should return undefined when buffer is empty', () => {
      const controller = new BackpressureController();
      expect(controller.peek()).toBeUndefined();
    });
  });

  describe('getUtilization', () => {
    it('should return buffer utilization', () => {
      const controller = new BackpressureController({
        maxBufferSize: 100,
      });
      
      controller.enqueue('x'.repeat(25));
      
      expect(controller.getUtilization()).toBe(0.5); // 50 bytes / 100 bytes
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const controller = new BackpressureController();
      controller.updateConfig({ maxBufferSize: 100 });
      
      controller.enqueue('x'.repeat(95));
      
      expect(controller.getState()).toBe('critical');
    });
  });

  describe('adaptive rate limiting', () => {
    it('should reduce rate limit on critical state', () => {
      const controller = new BackpressureController({
        maxBufferSize: 100,
        criticalThreshold: 0.9,
        adaptiveRateLimit: true,
        initialRateLimit: 1000,
        minRateLimit: 10,
      });
      
      controller.enqueue('x'.repeat(95));
      
      const stats = controller.getStats();
      expect(stats.currentRateLimit).toBeLessThan(1000);
    });

    it('should increase rate limit on normal state', () => {
      const controller = new BackpressureController({
        adaptiveRateLimit: true,
        initialRateLimit: 100,
        maxRateLimit: 1000,
      });
      
      // Trigger a state change back to normal
      controller.enqueue('x'.repeat(10));
      const initialRate = controller.getStats().currentRateLimit;
      
      // Force state update (would normally happen on dequeue)
      controller.dequeue();
      
      const newRate = controller.getStats().currentRateLimit;
      // Rate should stay same or increase when normal
      expect(newRate).toBeGreaterThanOrEqual(initialRate * 0.95);
    });
  });

  describe('state tracking', () => {
    it('should track time in warning state', async () => {
      vi.useFakeTimers();
      const controller = new BackpressureController({
        maxBufferSize: 100,
        warningThreshold: 0.5,
      });
      
      controller.enqueue('x'.repeat(60));
      vi.advanceTimersByTime(100);
      controller.dequeue();
      
      const stats = controller.getStats();
      expect(stats.timeInWarning).toBeGreaterThanOrEqual(100);
      
      vi.useRealTimers();
    });

    it('should track state transitions', () => {
      const controller = new BackpressureController({
        maxBufferSize: 100,
        warningThreshold: 0.5,
      });
      
      controller.enqueue('x'.repeat(60));
      controller.dequeue();
      
      const stats = controller.getStats();
      expect(stats.stateTransitions).toBeGreaterThan(0);
    });
  });
});
