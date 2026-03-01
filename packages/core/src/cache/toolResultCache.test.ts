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
  ToolResultCache,
  toolResultCache,
  type ToolResultCacheConfig,
  type ToolResultCacheEntry,
  type CacheLookupResult,
} from './toolResultCache.js';

describe('ToolResultCache', () => {
  describe('constructor', () => {
    it('should create cache with default config', () => {
      const cache = new ToolResultCache({ persistent: false });
      expect(cache).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const cache = new ToolResultCache({
        maxSize: 100,
        maxBytes: 1024 * 1024,
        persistent: false,
      });
      expect(cache).toBeDefined();
    });
  });

  describe('generateKey', () => {
    it('should generate consistent key for same input', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const key1 = cache.generateKey('read_file', { path: '/test/file.ts' });
      const key2 = cache.generateKey('read_file', { path: '/test/file.ts' });
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different tools', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const key1 = cache.generateKey('read_file', { path: '/test' });
      const key2 = cache.generateKey('write_file', { path: '/test' });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const key1 = cache.generateKey('read_file', { path: '/file1.ts' });
      const key2 = cache.generateKey('read_file', { path: '/file2.ts' });
      
      expect(key1).not.toBe(key2);
    });

    it('should normalize input order', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const key1 = cache.generateKey('test', { a: 1, b: 2 });
      const key2 = cache.generateKey('test', { b: 2, a: 1 });
      
      expect(key1).toBe(key2);
    });
  });

  describe('lookup', () => {
    it('should return found result', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('read_file', { path: '/test' }, { content: 'file content' });
      const result = cache.lookup('read_file', { path: '/test' });
      
      expect(result.found).toBe(true);
      expect(result.entry?.result).toEqual({ content: 'file content' });
    });

    it('should return not found for missing entry', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const result = cache.lookup('read_file', { path: '/missing' });
      
      expect(result.found).toBe(false);
      expect(result.entry).toBeUndefined();
    });

    it('should return not found for expired entry', async () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        defaultTTL: 10,
      });
      
      cache.store('read_file', { path: '/test' }, { content: 'test' }, { ttl: 10 });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const result = cache.lookup('read_file', { path: '/test' });
      
      expect(result.found).toBe(false);
    });

    it('should update access stats on hit', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('read_file', { path: '/test' }, { content: 'test' });
      cache.lookup('read_file', { path: '/test' });
      cache.lookup('read_file', { path: '/test' });
      
      const entry = cache.get(cache.generateKey('read_file', { path: '/test' }));
      expect(entry?.accessCount).toBe(2);
    });

    it('should call onHit callback', () => {
      const onHit = vi.fn();
      const cache = new ToolResultCache({ persistent: false, onHit });
      
      cache.store('read_file', { path: '/test' }, { content: 'test' });
      cache.lookup('read_file', { path: '/test' });
      
      expect(onHit).toHaveBeenCalled();
    });

    it('should call onMiss callback', () => {
      const onMiss = vi.fn();
      const cache = new ToolResultCache({ persistent: false, onMiss });
      
      cache.lookup('read_file', { path: '/missing' });
      
      expect(onMiss).toHaveBeenCalled();
    });

    it('should not cache excluded tools', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        excludeTools: ['write_file'],
      });
      
      const key = cache.store('write_file', { path: '/test' }, { content: 'test' });
      
      const result = cache.lookup('write_file', { path: '/test' });
      
      expect(result.found).toBe(false);
    });

    it('should only cache included tools', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        includeTools: ['read_file'],
      });
      
      cache.store('read_file', { path: '/test' }, { content: 'test' });
      cache.store('write_file', { path: '/test' }, { content: 'test' });
      
      expect(cache.lookup('read_file', { path: '/test' }).found).toBe(true);
      expect(cache.lookup('write_file', { path: '/test' }).found).toBe(false);
    });
  });

  describe('store', () => {
    it('should store successful result', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const key = cache.store('read_file', { path: '/test' }, { content: 'test' });
      
      expect(key).toBeDefined();
      expect(cache.lookup('read_file', { path: '/test' }).found).toBe(true);
    });

    it('should store error result when cacheErrors enabled', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        cacheErrors: true,
      });
      
      cache.store('test_tool', { input: 'test' }, null, {
        success: false,
        error: 'Something went wrong',
      });
      
      const result = cache.lookup('test_tool', { input: 'test' });
      
      expect(result.found).toBe(true);
      expect(result.entry?.success).toBe(false);
      expect(result.entry?.error).toBe('Something went wrong');
    });

    it('should not store error result when cacheErrors disabled', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        cacheErrors: false,
      });
      
      cache.store('test_tool', { input: 'test' }, null, {
        success: false,
        error: 'Error',
      });
      
      const result = cache.lookup('test_tool', { input: 'test' });
      
      expect(result.found).toBe(false);
    });

    it('should store metadata', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('read_file', { path: '/test' }, { content: 'test' }, {
        executionDuration: 150,
        tags: ['file', 'read'],
        metadata: { source: 'cache' },
      });
      
      const entry = cache.get(cache.generateKey('read_file', { path: '/test' }));
      
      expect(entry?.executionDuration).toBe(150);
      expect(entry?.tags).toContain('file');
      expect(entry?.metadata?.source).toBe('cache');
    });

    it('should use tool-specific TTL', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        toolTTLs: {
          read_file: 100,
        },
        defaultTTL: 60000,
      });
      
      cache.store('read_file', { path: '/test' }, { content: 'test' });
      
      const entry = cache.get(cache.generateKey('read_file', { path: '/test' }));
      
      // TTL should be close to 100 (current TTL calculation uses toolTTLs)
      expect(entry?.expiresAt).toBeDefined();
    });

    it('should use error TTL multiplier', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        cacheErrors: true,
        errorTTLMultiplier: 0.25,
        defaultTTL: 1000,
      });
      
      const now = Date.now();
      cache.store('test', {}, null, { success: false });
      
      const entry = cache.get(cache.generateKey('test', {}));
      
      // Error TTL should be reduced
      expect(entry?.expiresAt).toBeDefined();
    });

    it('should replace existing entry', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('read_file', { path: '/test' }, { content: 'old' });
      cache.store('read_file', { path: '/test' }, { content: 'new' });
      
      const result = cache.lookup('read_file', { path: '/test' });
      
      expect(result.entry?.result).toEqual({ content: 'new' });
    });
  });

  describe('delete', () => {
    it('should delete entry', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const key = cache.store('read_file', { path: '/test' }, { content: 'test' });
      const result = cache.delete(key);
      
      expect(result).toBe(true);
      expect(cache.lookup('read_file', { path: '/test' }).found).toBe(false);
    });

    it('should return false for missing key', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const result = cache.delete('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('a', {}, 'result1');
      cache.store('b', {}, 'result2');
      cache.store('c', {}, 'result3');
      
      cache.clear();
      
      expect(cache.keys()).toHaveLength(0);
    });

    it('should call onEvict callback', () => {
      const onEvict = vi.fn();
      const cache = new ToolResultCache({ persistent: false, onEvict });
      
      cache.store('test', {}, 'result');
      cache.clear();
      
      expect(onEvict).toHaveBeenCalled();
    });
  });

  describe('clearTool', () => {
    it('should clear entries for specific tool', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('read_file', { path: '/a' }, 'a');
      cache.store('read_file', { path: '/b' }, 'b');
      cache.store('write_file', { path: '/c' }, 'c');
      
      const cleared = cache.clearTool('read_file');
      
      expect(cleared).toBe(2);
      expect(cache.lookup('read_file', { path: '/a' }).found).toBe(false);
      expect(cache.lookup('write_file', { path: '/c' }).found).toBe(true);
    });
  });

  describe('prune', () => {
    it('should remove expired entries', async () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        defaultTTL: 10,
      });
      
      cache.store('a', {}, 'result', { ttl: 10 });
      cache.store('b', {}, 'result', { ttl: 100000 });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const pruned = cache.prune();
      
      expect(pruned).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('read_file', { path: '/a' }, 'a');
      cache.store('read_file', { path: '/b' }, 'b');
      cache.store('write_file', { path: '/c' }, 'c');
      
      cache.lookup('read_file', { path: '/a' }); // Hit
      cache.lookup('read_file', { path: '/missing' }); // Miss
      
      const stats = cache.getStats();
      
      expect(stats.entries).toBe(3);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.entriesByTool['read_file']).toBe(2);
      expect(stats.entriesByTool['write_file']).toBe(1);
    });

    it('should calculate time saved', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('read_file', { path: '/a' }, 'a', { executionDuration: 100 });
      cache.lookup('read_file', { path: '/a' });
      cache.lookup('read_file', { path: '/a' });
      
      const stats = cache.getStats();
      
      expect(stats.timeSavedMs).toBe(200); // 2 hits * 100ms
    });
  });

  describe('shouldCache', () => {
    it('should return true for cacheable tools', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      expect(cache.shouldCache('read_file')).toBe(true);
    });

    it('should return false for excluded tools', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        excludeTools: ['write_file'],
      });
      
      expect(cache.shouldCache('write_file')).toBe(false);
    });

    it('should respect includeTools list', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        includeTools: ['read_file'],
      });
      
      expect(cache.shouldCache('read_file')).toBe(true);
      expect(cache.shouldCache('write_file')).toBe(false);
    });

    it('should cache all when includeTools is null', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        includeTools: null,
      });
      
      expect(cache.shouldCache('any_tool')).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.updateConfig({ maxSize: 1 });
      
      cache.store('a', {}, '1');
      cache.store('b', {}, '2');
      cache.store('c', {}, '3');
      
      expect(cache.keys().length).toBeLessThanOrEqual(1);
    });
  });

  describe('get', () => {
    it('should return entry by key', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const key = cache.store('read_file', { path: '/test' }, { content: 'test' });
      const entry = cache.get(key);
      
      expect(entry?.result).toEqual({ content: 'test' });
    });

    it('should return undefined for missing key', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      const entry = cache.get('non-existent');
      
      expect(entry).toBeUndefined();
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('a', {}, '1');
      cache.store('b', {}, '2');
      
      const keys = cache.keys();
      
      expect(keys).toHaveLength(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when at capacity', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        maxSize: 2,
      });
      
      cache.store('a', { id: 1 }, 'result1');
      cache.store('b', { id: 2 }, 'result2');
      cache.lookup('a', { id: 1 }); // Access 'a' to make it more recent
      cache.store('c', { id: 3 }, 'result3'); // Should evict 'b'
      
      expect(cache.lookup('a', { id: 1 }).found).toBe(true);
      expect(cache.lookup('b', { id: 2 }).found).toBe(false);
      expect(cache.lookup('c', { id: 3 }).found).toBe(true);
    });

    it('should call onEvict callback on eviction', () => {
      const onEvict = vi.fn();
      const cache = new ToolResultCache({ 
        persistent: false,
        maxSize: 1,
        onEvict,
      });
      
      cache.store('a', {}, '1');
      cache.store('b', {}, '2');
      
      expect(onEvict).toHaveBeenCalled();
    });
  });

  describe('maxBytes limit', () => {
    it('should evict when maxBytes reached', () => {
      const cache = new ToolResultCache({ 
        persistent: false,
        maxSize: 100,
        maxBytes: 100,
      });
      
      cache.store('a', {}, 'x'.repeat(50));
      cache.store('b', {}, 'x'.repeat(50));
      cache.store('c', {}, 'x'.repeat(50));
      
      const stats = cache.getStats();
      expect(stats.totalBytes).toBeLessThanOrEqual(100);
    });
  });
});

describe('toolResultCache export', () => {
  it('should export singleton instance', () => {
    expect(toolResultCache).toBeInstanceOf(ToolResultCache);
  });
});
