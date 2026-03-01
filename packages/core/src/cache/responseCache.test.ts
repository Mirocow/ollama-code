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
  ResponseCache,
  SemanticCache,
  CacheManager,
  cacheManager,
  type CacheConfig,
  type CacheEntry,
  type CacheKeyComponents,
} from './responseCache.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('ResponseCache', () => {
  describe('constructor', () => {
    it('should create cache with default config', () => {
      const cache = new ResponseCache({ persistent: false });
      expect(cache).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const cache = new ResponseCache({
        maxSize: 100,
        defaultTTL: 60000,
        persistent: false,
      });
      expect(cache).toBeDefined();
    });
  });

  describe('generateKey', () => {
    it('should generate consistent key for same components', () => {
      const cache = new ResponseCache({ persistent: false });
      const components: CacheKeyComponents = {
        model: 'llama2',
        prompt: 'Hello, world!',
      };
      
      const key1 = cache.generateKey(components);
      const key2 = cache.generateKey(components);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different models', () => {
      const cache = new ResponseCache({ persistent: false });
      
      const key1 = cache.generateKey({ model: 'llama2', prompt: 'test' });
      const key2 = cache.generateKey({ model: 'mistral', prompt: 'test' });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different prompts', () => {
      const cache = new ResponseCache({ persistent: false });
      
      const key1 = cache.generateKey({ model: 'llama2', prompt: 'Hello' });
      const key2 = cache.generateKey({ model: 'llama2', prompt: 'World' });
      
      expect(key1).not.toBe(key2);
    });

    it('should include temperature in key', () => {
      const cache = new ResponseCache({ persistent: false });
      
      const key1 = cache.generateKey({ model: 'llama2', prompt: 'test', temperature: 0.5 });
      const key2 = cache.generateKey({ model: 'llama2', prompt: 'test', temperature: 1.0 });
      
      expect(key1).not.toBe(key2);
    });

    it('should include params in key', () => {
      const cache = new ResponseCache({ persistent: false });
      
      const key1 = cache.generateKey({ 
        model: 'llama2', 
        prompt: 'test',
        params: { top_p: 0.9 },
      });
      const key2 = cache.generateKey({ 
        model: 'llama2', 
        prompt: 'test',
        params: { top_p: 0.1 },
      });
      
      expect(key1).not.toBe(key2);
    });

    it('should use sha256 hash algorithm', () => {
      const cache = new ResponseCache({ 
        persistent: false,
        hashAlgorithm: 'sha256',
      });
      
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      expect(key.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it('should use md5 hash algorithm', () => {
      const cache = new ResponseCache({ 
        persistent: false,
        hashAlgorithm: 'md5',
      });
      
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      expect(key.length).toBe(32); // MD5 produces 32 hex characters
    });
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' });
      const value = cache.get(key);
      
      expect(value).toEqual({ response: 'Hello' });
    });

    it('should return null for missing key', () => {
      const cache = new ResponseCache({ persistent: false });
      
      const value = cache.get('non-existent-key');
      
      expect(value).toBeNull();
    });

    it('should return null for expired entry', async () => {
      const cache = new ResponseCache({ 
        persistent: false,
        defaultTTL: 10,
      });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' }, 10);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const value = cache.get(key);
      
      expect(value).toBeNull();
    });

    it('should update access stats on get', () => {
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' });
      cache.get(key);
      cache.get(key);
      
      const entries = cache.entries();
      expect(entries[0].accessCount).toBe(2);
    });

    it('should update lastAccessedAt on get', () => {
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' });
      const before = cache.entries()[0].lastAccessedAt;
      
      // Small delay
      const start = Date.now();
      while (Date.now() - start < 10) {}
      
      cache.get(key);
      const after = cache.entries()[0].lastAccessedAt;
      
      expect(after).toBeGreaterThan(before);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' });
      
      expect(cache.has(key)).toBe(true);
    });

    it('should return false for missing key', () => {
      const cache = new ResponseCache({ persistent: false });
      
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' }, 10);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(cache.has(key)).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete entry', () => {
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' });
      const result = cache.delete(key);
      
      expect(result).toBe(true);
      expect(cache.get(key)).toBeNull();
    });

    it('should return false for missing key', () => {
      const cache = new ResponseCache({ persistent: false });
      
      const result = cache.delete('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      const cache = new ResponseCache({ persistent: false });
      
      cache.set('key1', { response: 'a' });
      cache.set('key2', { response: 'b' });
      cache.set('key3', { response: 'c' });
      
      cache.clear();
      
      expect(cache.keys()).toHaveLength(0);
    });
  });

  describe('keys and entries', () => {
    it('should return all keys', () => {
      const cache = new ResponseCache({ persistent: false });
      
      cache.set('key1', { response: 'a' });
      cache.set('key2', { response: 'b' });
      
      const keys = cache.keys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should return all entries', () => {
      const cache = new ResponseCache({ persistent: false });
      
      cache.set('key1', { response: 'a' });
      cache.set('key2', { response: 'b' });
      
      const entries = cache.entries();
      
      expect(entries).toHaveLength(2);
      expect(entries[0].key).toBeDefined();
      expect(entries[0].value).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' });
      cache.get(key); // Hit
      cache.get('missing'); // Miss
      
      const stats = cache.getStats();
      
      expect(stats.entries).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should calculate total size', () => {
      const cache = new ResponseCache({ persistent: false });
      
      cache.set('key1', { response: 'a'.repeat(100) });
      cache.set('key2', { response: 'b'.repeat(200) });
      
      const stats = cache.getStats();
      
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should track oldest and newest entry', () => {
      const cache = new ResponseCache({ persistent: false });
      
      cache.set('key1', { response: 'a' });
      // Small delay
      const start = Date.now();
      while (Date.now() - start < 5) {}
      cache.set('key2', { response: 'b' });
      
      const stats = cache.getStats();
      
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
      expect(stats.newestEntry).toBeGreaterThan(stats.oldestEntry!);
    });
  });

  describe('prune', () => {
    it('should remove expired entries', async () => {
      const cache = new ResponseCache({ persistent: false });
      
      cache.set('key1', { response: 'a' }, 10);
      cache.set('key2', { response: 'b' }, 100000);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const pruned = cache.prune();
      
      expect(pruned).toBe(1);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when at capacity', () => {
      const cache = new ResponseCache({ 
        persistent: false,
        maxSize: 2,
      });
      
      cache.set('key1', { response: 'a' });
      cache.set('key2', { response: 'b' });
      cache.get('key1'); // Access key1 to make it more recent
      cache.set('key3', { response: 'c' }); // Should evict key2
      
      const keys = cache.keys();
      
      expect(keys).toContain('key1');
      expect(keys).not.toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('metadata', () => {
    it('should store metadata', () => {
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' }, 60000, {
        model: 'llama2',
        tokens: { prompt: 10, completion: 20, total: 30 },
      });
      
      const entries = cache.entries();
      expect(entries[0].model).toBe('llama2');
      expect(entries[0].tokens).toEqual({ prompt: 10, completion: 20, total: 30 });
    });
  });
});

describe('SemanticCache', () => {
  describe('constructor', () => {
    it('should create cache with default threshold', () => {
      const cache = new SemanticCache();
      expect(cache.size).toBe(0);
    });

    it('should create cache with custom threshold', () => {
      const cache = new SemanticCache(0.9);
      expect(cache).toBeDefined();
    });
  });

  describe('set and findSimilar', () => {
    it('should find similar embedding', () => {
      const cache = new SemanticCache(0.9);
      
      const embedding1 = [1, 0, 0, 0];
      const embedding2 = [0.99, 0.01, 0, 0]; // Very similar
      const embedding3 = [0, 1, 0, 0]; // Different
      
      const entry: CacheEntry = {
        key: 'test',
        value: { response: 'Hello' },
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        accessCount: 0,
        lastAccessedAt: Date.now(),
      };
      
      cache.set('key1', embedding1, entry);
      
      const similar = cache.findSimilar(embedding2);
      expect(similar).toBeDefined();
      
      const different = cache.findSimilar(embedding3);
      expect(different).toBeNull();
    });

    it('should return null for no similar entries', () => {
      const cache = new SemanticCache(0.99);
      
      const embedding1 = [1, 0, 0, 0];
      const embedding2 = [0.5, 0.5, 0, 0]; // Not similar enough
      
      const entry: CacheEntry = {
        key: 'test',
        value: { response: 'Hello' },
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        accessCount: 0,
        lastAccessedAt: Date.now(),
      };
      
      cache.set('key1', embedding1, entry);
      
      const similar = cache.findSimilar(embedding2);
      expect(similar).toBeNull();
    });

    it('should handle vectors of different lengths', () => {
      const cache = new SemanticCache();
      
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0, 0]; // Different length
      
      const entry: CacheEntry = {
        key: 'test',
        value: { response: 'Hello' },
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        accessCount: 0,
        lastAccessedAt: Date.now(),
      };
      
      cache.set('key1', embedding1, entry);
      
      const similar = cache.findSimilar(embedding2);
      expect(similar).toBeNull();
    });

    it('should handle zero vectors', () => {
      const cache = new SemanticCache();
      
      const zeroEmbedding = [0, 0, 0, 0];
      const normalEmbedding = [1, 0, 0, 0];
      
      const entry: CacheEntry = {
        key: 'test',
        value: { response: 'Hello' },
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        accessCount: 0,
        lastAccessedAt: Date.now(),
      };
      
      cache.set('key1', zeroEmbedding, entry);
      
      const similar = cache.findSimilar(normalEmbedding);
      expect(similar).toBeNull(); // Zero vector has no similarity
    });
  });

  describe('clear', () => {
    it('should clear cache', () => {
      const cache = new SemanticCache();
      
      const embedding = [1, 0, 0, 0];
      const entry: CacheEntry = {
        key: 'test',
        value: { response: 'Hello' },
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        accessCount: 0,
        lastAccessedAt: Date.now(),
      };
      
      cache.set('key1', embedding, entry);
      cache.clear();
      
      expect(cache.size).toBe(0);
    });
  });
});

describe('CacheManager', () => {
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = CacheManager.getInstance();
      const instance2 = CacheManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getResponseCache', () => {
    it('should return ResponseCache instance', () => {
      const manager = CacheManager.getInstance();
      const responseCache = manager.getResponseCache();
      
      expect(responseCache).toBeInstanceOf(ResponseCache);
    });
  });

  describe('getSemanticCache', () => {
    it('should return SemanticCache instance', () => {
      const manager = CacheManager.getInstance();
      const semanticCache = manager.getSemanticCache();
      
      expect(semanticCache).toBeInstanceOf(SemanticCache);
    });
  });

  describe('clearAll', () => {
    it('should clear all caches', () => {
      const manager = CacheManager.getInstance();
      const responseCache = manager.getResponseCache();
      
      responseCache.set('test', { response: 'a' });
      manager.clearAll();
      
      expect(responseCache.keys()).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return combined statistics', () => {
      const manager = CacheManager.getInstance();
      const stats = manager.getStats();
      
      expect(stats.response).toBeDefined();
      expect(stats.semantic).toBeDefined();
    });
  });
});

describe('cacheManager export', () => {
  it('should export singleton instance', () => {
    expect(cacheManager).toBeInstanceOf(CacheManager);
  });
});
