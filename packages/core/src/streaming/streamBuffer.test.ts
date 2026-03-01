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
  StreamBuffer,
  type BufferConfig,
  type BufferItem,
} from './streamBuffer.js';

describe('StreamBuffer', () => {
  describe('constructor', () => {
    it('should create buffer with default config', () => {
      const buffer = new StreamBuffer();
      expect(buffer.length).toBe(0);
      expect(buffer.size).toBe(0);
      expect(buffer.isEmpty()).toBe(true);
    });

    it('should merge custom config with defaults', () => {
      const buffer = new StreamBuffer({
        maxSize: 1024,
        maxItems: 10,
      });
      expect(buffer).toBeDefined();
    });
  });

  describe('add', () => {
    it('should add item to buffer', () => {
      const buffer = new StreamBuffer();
      const result = buffer.add('test');
      
      expect(result).toBe(true);
      expect(buffer.length).toBe(1);
    });

    it('should calculate size for string data', () => {
      const buffer = new StreamBuffer();
      buffer.add('test');
      
      expect(buffer.size).toBe(8); // 4 chars * 2 bytes
    });

    it('should calculate size for ArrayBuffer', () => {
      const buffer = new StreamBuffer();
      const arr = new ArrayBuffer(50);
      buffer.add(arr);
      
      expect(buffer.size).toBe(50);
    });

    it('should calculate size for TypedArray', () => {
      const buffer = new StreamBuffer();
      const arr = new Uint8Array(30);
      buffer.add(arr);
      
      expect(buffer.size).toBe(30);
    });

    it('should handle null data', () => {
      const buffer = new StreamBuffer();
      buffer.add(null);
      
      expect(buffer.size).toBe(0);
    });

    it('should handle undefined data', () => {
      const buffer = new StreamBuffer();
      buffer.add(undefined);
      
      expect(buffer.size).toBe(0);
    });

    it('should handle circular references', () => {
      const buffer = new StreamBuffer();
      const obj: Record<string, unknown> = { key: 'value' };
      obj.self = obj;
      
      buffer.add(obj);
      
      expect(buffer.size).toBe(1024); // Default estimate
    });

    it('should respect maxItems limit', () => {
      const buffer = new StreamBuffer({ maxItems: 2, enableAggregation: false });
      
      buffer.add('a');
      buffer.add('b');
      const result = buffer.add('c');
      
      expect(result).toBe(false);
    });

    it('should respect maxSize limit', () => {
      const buffer = new StreamBuffer({ maxSize: 10, enableAggregation: false });
      
      buffer.add('abcde'); // 10 bytes
      const result = buffer.add('x'); // Would exceed
      
      expect(result).toBe(false);
    });

    it('should call onFull callback when full', () => {
      const onFull = vi.fn();
      const buffer = new StreamBuffer({ maxItems: 1, onFull, enableAggregation: false });
      
      buffer.add('a');
      buffer.add('b');
      
      expect(onFull).toHaveBeenCalled();
    });

    it('should assign sequence number', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      
      buffer.add('a');
      buffer.add('b');
      
      const item1 = buffer.get();
      const item2 = buffer.get();
      
      expect(item1?.sequence).toBe(0);
      expect(item2?.sequence).toBe(1);
    });

    it('should assign priority', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      
      buffer.add('low', 0);
      buffer.add('high', 10);
      
      const item = buffer.peek();
      expect(item?.priority).toBe(0);
    });
  });

  describe('get', () => {
    it('should return item from buffer', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('test');
      
      const item = buffer.get();
      
      expect(item?.data).toBe('test');
      expect(buffer.length).toBe(0);
    });

    it('should return undefined when buffer is empty', () => {
      const buffer = new StreamBuffer();
      
      const item = buffer.get();
      
      expect(item).toBeUndefined();
    });

    it('should respect preserveOrder config', () => {
      const buffer = new StreamBuffer({ preserveOrder: true, enableAggregation: false });
      
      buffer.add('first');
      buffer.add('second');
      
      expect(buffer.get()?.data).toBe('first');
      expect(buffer.get()?.data).toBe('second');
    });

    it('should return items in reverse when preserveOrder is false', () => {
      const buffer = new StreamBuffer({ preserveOrder: false, enableAggregation: false });
      
      buffer.add('first');
      buffer.add('second');
      
      expect(buffer.get()?.data).toBe('second');
      expect(buffer.get()?.data).toBe('first');
    });
  });

  describe('peek', () => {
    it('should return first item without removing', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('test');
      
      const item = buffer.peek();
      
      expect(item?.data).toBe('test');
      expect(buffer.length).toBe(1);
    });

    it('should return undefined when buffer is empty', () => {
      const buffer = new StreamBuffer();
      
      expect(buffer.peek()).toBeUndefined();
    });
  });

  describe('getAggregated', () => {
    it('should aggregate string items', async () => {
      const buffer = new StreamBuffer({
        enableAggregation: true,
        aggregationTimeout: 10,
        minAggregationItems: 2,
      });
      
      buffer.add('Hello, ');
      buffer.add('World!');
      
      // Wait for aggregation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const item = buffer.getAggregated();
      
      expect(item?.data).toBe('Hello, World!');
      expect(item?.aggregated).toBe(true);
    });

    it('should aggregate array items', async () => {
      const buffer = new StreamBuffer({
        enableAggregation: true,
        aggregationTimeout: 10,
        minAggregationItems: 2,
      });
      
      buffer.add([1, 2]);
      buffer.add([3, 4]);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const item = buffer.getAggregated();
      
      expect(item?.data).toEqual([1, 2, 3, 4]);
    });

    it('should return single item when aggregation disabled', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('test');
      
      const item = buffer.getAggregated();
      
      expect(item?.data).toBe('test');
      expect(item?.aggregated).toBeUndefined();
    });

    it('should handle single item in aggregation buffer', async () => {
      const buffer = new StreamBuffer({
        enableAggregation: true,
        aggregationTimeout: 10,
      });
      
      buffer.add('single');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const item = buffer.getAggregated();
      
      expect(item?.data).toBe('single');
      expect(item?.aggregated).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all items and clear buffer', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('a');
      buffer.add('b');
      buffer.add('c');
      
      const items = buffer.getAll();
      
      expect(items).toHaveLength(3);
      expect(buffer.length).toBe(0);
      expect(buffer.size).toBe(0);
    });
  });

  describe('isFull', () => {
    it('should return false when not full', () => {
      const buffer = new StreamBuffer();
      expect(buffer.isFull()).toBe(false);
    });

    it('should return true when maxItems reached', () => {
      const buffer = new StreamBuffer({ maxItems: 2, enableAggregation: false });
      buffer.add('a');
      buffer.add('b');
      
      expect(buffer.isFull()).toBe(true);
    });

    it('should return true when maxSize reached', () => {
      const buffer = new StreamBuffer({ maxSize: 10, enableAggregation: false });
      buffer.add('abcde'); // 10 bytes
      
      expect(buffer.isFull()).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return buffer statistics', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('test');
      
      const stats = buffer.getStats();
      
      expect(stats.itemCount).toBe(1);
      expect(stats.size).toBe(8);
      expect(stats.totalAdded).toBe(1);
      expect(stats.utilization).toBeGreaterThan(0);
    });

    it('should track peak items', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('a');
      buffer.add('b');
      buffer.get();
      
      const stats = buffer.getStats();
      
      expect(stats.peakItems).toBe(2);
    });

    it('should track peak size', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('x'.repeat(100));
      buffer.get();
      
      const stats = buffer.getStats();
      
      expect(stats.peakSize).toBe(200);
    });
  });

  describe('clear', () => {
    it('should clear the buffer', () => {
      const buffer = new StreamBuffer();
      buffer.add('a');
      buffer.add('b');
      
      buffer.clear();
      
      expect(buffer.length).toBe(0);
      expect(buffer.size).toBe(0);
    });

    it('should reset stats', () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('a');
      
      buffer.clear();
      
      const stats = buffer.getStats();
      expect(stats.itemCount).toBe(0);
      expect(stats.totalAdded).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const buffer = new StreamBuffer();
      buffer.updateConfig({ maxSize: 10 });
      
      buffer.add('x'.repeat(5));
      const result = buffer.add('x'.repeat(10));
      
      expect(result).toBe(false);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire old items', async () => {
      vi.useFakeTimers();
      const onExpire = vi.fn();
      const buffer = new StreamBuffer({
        ttl: 100,
        onExpire,
        enableAggregation: false,
      });
      
      buffer.add('old');
      
      vi.advanceTimersByTime(200);
      
      const item = buffer.get();
      
      expect(item).toBeUndefined();
      expect(onExpire).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should prune expired items on access', async () => {
      vi.useFakeTimers();
      const buffer = new StreamBuffer({ ttl: 100, enableAggregation: false });
      
      buffer.add('old');
      
      vi.advanceTimersByTime(200);
      
      buffer.peek();
      
      expect(buffer.length).toBe(0);
      
      vi.useRealTimers();
    });

    it('should skip pruning when ttl is 0', () => {
      const buffer = new StreamBuffer({ ttl: 0, enableAggregation: false });
      
      buffer.add('test');
      
      buffer.peek();
      
      expect(buffer.length).toBe(1);
    });
  });

  describe('async iterator', () => {
    it('should iterate over all items', async () => {
      const buffer = new StreamBuffer({ enableAggregation: false });
      buffer.add('a');
      buffer.add('b');
      buffer.add('c');
      
      const items: BufferItem[] = [];
      for await (const item of buffer) {
        items.push(item);
      }
      
      expect(items).toHaveLength(3);
    });
  });

  describe('aggregation behavior', () => {
    it('should not aggregate large items', async () => {
      const buffer = new StreamBuffer({
        enableAggregation: true,
        maxAggregatedSize: 100,
        aggregationTimeout: 10,
      });
      
      buffer.add('x'.repeat(100)); // Too large to aggregate
      buffer.add('y');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const item = buffer.getAggregated();
      expect(item?.aggregated).toBeUndefined();
    });

    it('should flush aggregation on timeout', async () => {
      vi.useFakeTimers();
      const buffer = new StreamBuffer({
        enableAggregation: true,
        aggregationTimeout: 100,
        minAggregationItems: 2,
      });
      
      buffer.add('Hello, ');
      buffer.add('World!');
      
      vi.advanceTimersByTime(100);
      
      expect(buffer.length).toBe(1);
      
      vi.useRealTimers();
    });
  });
});
