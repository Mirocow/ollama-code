/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import * as cacheModule from './index.js';

describe('Cache Module Index', () => {
  describe('ResponseCache exports', () => {
    it('should export ResponseCache', () => {
      expect(cacheModule.ResponseCache).toBeDefined();
      expect(typeof cacheModule.ResponseCache).toBe('function');
    });

    it('should export SemanticCache', () => {
      expect(cacheModule.SemanticCache).toBeDefined();
      expect(typeof cacheModule.SemanticCache).toBe('function');
    });

    it('should export CacheManager', () => {
      expect(cacheModule.CacheManager).toBeDefined();
      expect(typeof cacheModule.CacheManager).toBe('function');
    });

    it('should export cacheManager singleton', () => {
      expect(cacheModule.cacheManager).toBeDefined();
      expect(cacheModule.cacheManager).toBeInstanceOf(cacheModule.CacheManager);
    });
  });

  describe('EmbeddingCache exports', () => {
    it('should export EmbeddingCache', () => {
      expect(cacheModule.EmbeddingCache).toBeDefined();
      expect(typeof cacheModule.EmbeddingCache).toBe('function');
    });

    it('should export embeddingCache singleton', () => {
      expect(cacheModule.embeddingCache).toBeDefined();
      expect(cacheModule.embeddingCache).toBeInstanceOf(cacheModule.EmbeddingCache);
    });

    it('should export VectorOps', () => {
      expect(cacheModule.VectorOps).toBeDefined();
      expect(typeof cacheModule.VectorOps).toBe('object');
      expect(typeof cacheModule.VectorOps.cosineSimilarity).toBe('function');
      expect(typeof cacheModule.VectorOps.euclideanDistance).toBe('function');
      expect(typeof cacheModule.VectorOps.normalize).toBe('function');
    });
  });

  describe('ToolResultCache exports', () => {
    it('should export ToolResultCache', () => {
      expect(cacheModule.ToolResultCache).toBeDefined();
      expect(typeof cacheModule.ToolResultCache).toBe('function');
    });

    it('should export toolResultCache singleton', () => {
      expect(cacheModule.toolResultCache).toBeDefined();
      expect(cacheModule.toolResultCache).toBeInstanceOf(cacheModule.ToolResultCache);
    });
  });

  describe('Integration Tests', () => {
    it('should work with ResponseCache', () => {
      const { ResponseCache } = cacheModule;
      
      const cache = new ResponseCache({ persistent: false });
      const key = cache.generateKey({ model: 'test', prompt: 'test' });
      
      cache.set(key, { response: 'Hello' });
      const value = cache.get(key);
      
      expect(value).toEqual({ response: 'Hello' });
    });

    it('should work with EmbeddingCache', () => {
      const { EmbeddingCache, VectorOps } = cacheModule;
      
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.set('test', [0.1, 0.2, 0.3], 'test-model');
      const result = cache.get('test', 'test-model');
      
      expect(result).toEqual([0.1, 0.2, 0.3]);
      
      // Test VectorOps
      const similarity = VectorOps.cosineSimilarity([1, 0], [1, 0]);
      expect(similarity).toBe(1);
    });

    it('should work with ToolResultCache', () => {
      const { ToolResultCache } = cacheModule;
      
      const cache = new ToolResultCache({ persistent: false });
      
      cache.store('read_file', { path: '/test' }, { content: 'file content' });
      const result = cache.lookup('read_file', { path: '/test' });
      
      expect(result.found).toBe(true);
      expect(result.entry?.result).toEqual({ content: 'file content' });
    });

    it('should work with SemanticCache', () => {
      const { SemanticCache } = cacheModule;
      
      const cache = new SemanticCache(0.9);
      
      const entry = {
        key: 'test',
        value: { response: 'test' },
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        accessCount: 0,
        lastAccessedAt: Date.now(),
      };
      
      cache.set('key1', [1, 0, 0, 0], entry);
      
      const similar = cache.findSimilar([0.99, 0.01, 0, 0]);
      expect(similar).toBeDefined();
    });

    it('should use CacheManager singleton', () => {
      const { CacheManager } = cacheModule;
      
      const manager = CacheManager.getInstance();
      const responseCache = manager.getResponseCache();
      const semanticCache = manager.getSemanticCache();
      
      expect(responseCache).toBeDefined();
      expect(semanticCache).toBeDefined();
      
      const stats = manager.getStats();
      expect(stats.response).toBeDefined();
      expect(stats.semantic).toBeDefined();
    });
  });

  describe('Type exports', () => {
    it('should have CacheEntry type available', () => {
      // Type exports are verified by TypeScript compilation
      const { ResponseCache } = cacheModule;
      const cache = new ResponseCache({ persistent: false });
      const entries = cache.entries();
      expect(Array.isArray(entries)).toBe(true);
    });

    it('should have CacheConfig type available', () => {
      const { ResponseCache } = cacheModule;
      const config = { maxSize: 100, persistent: false };
      const cache = new ResponseCache(config);
      expect(cache).toBeDefined();
    });

    it('should have CacheStats type available', () => {
      const { ResponseCache } = cacheModule;
      const cache = new ResponseCache({ persistent: false });
      const stats = cache.getStats();
      expect(stats.entries).toBeDefined();
      expect(stats.hits).toBeDefined();
    });

    it('should have EmbeddingCacheEntry type available', () => {
      const { EmbeddingCache } = cacheModule;
      const cache = new EmbeddingCache({ persistent: false });
      const entries = cache.getByModel('test');
      expect(Array.isArray(entries)).toBe(true);
    });

    it('should have ToolResultCacheEntry type available', () => {
      const { ToolResultCache } = cacheModule;
      const cache = new ToolResultCache({ persistent: false });
      const key = cache.store('test', {}, 'result');
      const entry = cache.get(key);
      expect(entry?.result).toBe('result');
    });

    it('should have CacheLookupResult type available', () => {
      const { ToolResultCache } = cacheModule;
      const cache = new ToolResultCache({ persistent: false });
      const result = cache.lookup('test', {});
      expect(result.found).toBe(false);
    });
  });
});
