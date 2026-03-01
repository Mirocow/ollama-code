/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { LruCache } from './LruCache.js';

describe('LruCache', () => {
  describe('constructor', () => {
    it('should create cache with specified max size', () => {
      const cache = new LruCache<string, number>(5);
      expect(cache).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent key', () => {
      const cache = new LruCache<string, number>(3);
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should return value for existing key', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('key1', 1);
      expect(cache.get('key1')).toBe(1);
    });

    it('should move accessed key to end (most recently used)', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add another item, should evict key2 (least recently used)
      cache.set('key4', 4);

      expect(cache.get('key1')).toBe(1);
      expect(cache.get('key2')).toBeUndefined(); // Evicted
      expect(cache.get('key3')).toBe(3);
      expect(cache.get('key4')).toBe(4);
    });
  });

  describe('set', () => {
    it('should add new key-value pair', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('key1', 1);
      expect(cache.get('key1')).toBe(1);
    });

    it('should update existing key', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('key1', 1);
      cache.set('key1', 2);
      expect(cache.get('key1')).toBe(2);
    });

    it('should evict least recently used when at capacity', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      cache.set('key4', 4);

      expect(cache.get('key1')).toBeUndefined(); // Evicted
      expect(cache.get('key2')).toBe(2);
      expect(cache.get('key3')).toBe(3);
      expect(cache.get('key4')).toBe(4);
    });

    it('should update position when updating existing key', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      // Update key1 - should move to end
      cache.set('key1', 10);

      // Add key4 - should evict key2
      cache.set('key4', 4);

      expect(cache.get('key1')).toBe(10);
      expect(cache.get('key2')).toBeUndefined(); // Evicted
      expect(cache.get('key3')).toBe(3);
      expect(cache.get('key4')).toBe(4);
    });

    it('should handle max size of 1', () => {
      const cache = new LruCache<string, number>(1);
      cache.set('key1', 1);
      cache.set('key2', 2);

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should allow adding items after clear', () => {
      const cache = new LruCache<string, number>(3);
      cache.set('key1', 1);
      cache.clear();
      cache.set('key2', 2);

      expect(cache.get('key2')).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle various key types', () => {
      const cache = new LruCache<number, string>(3);
      cache.set(1, 'one');
      cache.set(2, 'two');

      expect(cache.get(1)).toBe('one');
      expect(cache.get(2)).toBe('two');
    });

    it('should handle object keys by reference', () => {
      const cache = new LruCache<object, string>(3);
      const key1 = { id: 1 };
      const key2 = { id: 2 };

      cache.set(key1, 'value1');
      cache.set(key2, 'value2');

      expect(cache.get(key1)).toBe('value1');
      expect(cache.get(key2)).toBe('value2');
      expect(cache.get({ id: 1 })).toBeUndefined(); // Different reference
    });

    it('should handle undefined values', () => {
      const cache = new LruCache<string, number | undefined>(3);
      cache.set('key1', undefined);

      // Undefined values return false in the get check, so they're treated as missing
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should handle null values', () => {
      const cache = new LruCache<string, string | null>(3);
      cache.set('key1', null);

      // Null is truthy for the existence check
      expect(cache.get('key1')).toBeNull();
    });
  });
});
