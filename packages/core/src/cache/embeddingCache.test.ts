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
  EmbeddingCache,
  embeddingCache,
  VectorOps,
  type EmbeddingCacheConfig,
  type EmbeddingCacheEntry,
} from './embeddingCache.js';

describe('EmbeddingCache', () => {
  describe('constructor', () => {
    it('should create cache with default config', () => {
      const cache = new EmbeddingCache({ persistent: false });
      expect(cache.size).toBe(0);
    });

    it('should merge custom config with defaults', () => {
      const cache = new EmbeddingCache({
        maxSize: 100,
        persistent: false,
        hashAlgorithm: 'md5',
      });
      expect(cache).toBeDefined();
    });
  });

  describe('generateKey', () => {
    it('should generate consistent key for same text and model', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      const key1 = cache.generateKey('Hello, world!', 'llama2');
      const key2 = cache.generateKey('Hello, world!', 'llama2');
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different texts', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      const key1 = cache.generateKey('Hello', 'llama2');
      const key2 = cache.generateKey('World', 'llama2');
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different models', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      const key1 = cache.generateKey('test', 'llama2');
      const key2 = cache.generateKey('test', 'mistral');
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve embedding', () => {
      const cache = new EmbeddingCache({ persistent: false });
      const embedding = [0.1, 0.2, 0.3, 0.4];
      
      cache.set('Hello', embedding, 'llama2');
      
      const result = cache.get('Hello', 'llama2');
      expect(result).toEqual(embedding);
    });

    it('should return null for missing embedding', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      const result = cache.get('missing', 'llama2');
      
      expect(result).toBeNull();
    });

    it('should update access stats', () => {
      const cache = new EmbeddingCache({ persistent: false, storeText: true });
      
      cache.set('test', [0.1, 0.2], 'llama2');
      cache.get('test', 'llama2');
      cache.get('test', 'llama2');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track misses', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.get('missing', 'llama2');
      cache.get('also-missing', 'llama2');
      
      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });
  });

  describe('getByKey', () => {
    it('should retrieve embedding by key', () => {
      const cache = new EmbeddingCache({ persistent: false });
      const embedding = [0.1, 0.2, 0.3];
      
      cache.set('test', embedding, 'llama2');
      const key = cache.generateKey('test', 'llama2');
      
      const result = cache.getByKey(key);
      expect(result).toEqual(embedding);
    });

    it('should return null for missing key', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      const result = cache.getByKey('non-existent');
      
      expect(result).toBeNull();
    });
  });

  describe('getBatch and setBatch', () => {
    it('should get multiple embeddings', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.set('text1', [0.1, 0.2], 'llama2');
      cache.set('text2', [0.3, 0.4], 'llama2');
      
      const results = cache.getBatch([
        { text: 'text1', model: 'llama2' },
        { text: 'text2', model: 'llama2' },
        { text: 'missing', model: 'llama2' },
      ]);
      
      expect(results.size).toBe(3);
      expect(results.get('llama2:text1')).toEqual([0.1, 0.2]);
      expect(results.get('llama2:text2')).toEqual([0.3, 0.4]);
      expect(results.get('llama2:missing')).toBeNull();
    });

    it('should set multiple embeddings', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.setBatch([
        { text: 'text1', embedding: [0.1, 0.2], model: 'llama2' },
        { text: 'text2', embedding: [0.3, 0.4], model: 'llama2' },
      ]);
      
      expect(cache.size).toBe(2);
      expect(cache.get('text1', 'llama2')).toEqual([0.1, 0.2]);
      expect(cache.get('text2', 'llama2')).toEqual([0.3, 0.4]);
    });
  });

  describe('has', () => {
    it('should return true for existing embedding', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.set('test', [0.1, 0.2], 'llama2');
      
      expect(cache.has('test', 'llama2')).toBe(true);
    });

    it('should return false for missing embedding', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      expect(cache.has('missing', 'llama2')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete embedding', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.set('test', [0.1, 0.2], 'llama2');
      const result = cache.delete('test', 'llama2');
      
      expect(result).toBe(true);
      expect(cache.has('test', 'llama2')).toBe(false);
    });

    it('should return false for missing key', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      const result = cache.delete('missing', 'llama2');
      
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.set('a', [0.1], 'llama2');
      cache.set('b', [0.2], 'llama2');
      cache.set('c', [0.3], 'llama2');
      
      cache.clear();
      
      expect(cache.size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.set('test', [0.1, 0.2, 0.3], 'llama2');
      cache.get('test', 'llama2');
      cache.get('missing', 'llama2');
      
      const stats = cache.getStats();
      
      expect(stats.entries).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.averageDimensions).toBe(3);
      expect(stats.memoryUsage).toBe(24); // 3 numbers * 8 bytes
    });

    it('should handle empty cache', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      const stats = cache.getStats();
      
      expect(stats.averageDimensions).toBe(0);
    });
  });

  describe('getByModel', () => {
    it('should return entries by model', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.set('text1', [0.1], 'llama2');
      cache.set('text2', [0.2], 'llama2');
      cache.set('text3', [0.3], 'mistral');
      
      const llamaEntries = cache.getByModel('llama2');
      
      expect(llamaEntries).toHaveLength(2);
      expect(llamaEntries.every(e => e.model === 'llama2')).toBe(true);
    });

    it('should return empty array for unknown model', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      const entries = cache.getByModel('unknown');
      
      expect(entries).toHaveLength(0);
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      const cache = new EmbeddingCache({ persistent: false });
      
      cache.set('a', [0.1], 'llama2');
      cache.set('b', [0.2], 'llama2');
      
      const keys = cache.keys();
      
      expect(keys).toHaveLength(2);
    });
  });

  describe('storeText option', () => {
    it('should store original text when enabled', () => {
      const cache = new EmbeddingCache({ persistent: false, storeText: true });
      
      cache.set('Hello, world!', [0.1, 0.2], 'llama2');
      
      const entries = cache.getByModel('llama2');
      expect(entries[0].text).toBe('Hello, world!');
    });

    it('should not store original text when disabled', () => {
      const cache = new EmbeddingCache({ persistent: false, storeText: false });
      
      cache.set('Hello, world!', [0.1, 0.2], 'llama2');
      
      const entries = cache.getByModel('llama2');
      expect(entries[0].text).toBeUndefined();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when at capacity', () => {
      const cache = new EmbeddingCache({ 
        persistent: false,
        maxSize: 2,
      });
      
      cache.set('a', [0.1], 'llama2');
      cache.set('b', [0.2], 'llama2');
      cache.get('a', 'llama2'); // Access 'a' to make it more recent
      cache.set('c', [0.3], 'llama2'); // Should evict 'b'
      
      expect(cache.has('a', 'llama2')).toBe(true);
      expect(cache.has('b', 'llama2')).toBe(false);
      expect(cache.has('c', 'llama2')).toBe(true);
    });
  });
});

describe('VectorOps', () => {
  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity', () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];
      
      expect(VectorOps.cosineSimilarity(a, b)).toBe(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      
      expect(VectorOps.cosineSimilarity(a, b)).toBe(0);
    });

    it('should handle different length vectors', () => {
      const a = [1, 0];
      const b = [1, 0, 0];
      
      expect(VectorOps.cosineSimilarity(a, b)).toBe(0);
    });

    it('should handle zero vectors', () => {
      const a = [0, 0, 0];
      const b = [1, 1, 1];
      
      expect(VectorOps.cosineSimilarity(a, b)).toBe(0);
    });
  });

  describe('euclideanDistance', () => {
    it('should calculate euclidean distance', () => {
      const a = [0, 0, 0];
      const b = [1, 1, 1];
      
      expect(VectorOps.euclideanDistance(a, b)).toBeCloseTo(Math.sqrt(3));
    });

    it('should return 0 for same vectors', () => {
      const a = [1, 2, 3];
      
      expect(VectorOps.euclideanDistance(a, a)).toBe(0);
    });

    it('should return Infinity for different length vectors', () => {
      const a = [1, 2];
      const b = [1, 2, 3];
      
      expect(VectorOps.euclideanDistance(a, b)).toBe(Infinity);
    });
  });

  describe('normalize', () => {
    it('should normalize vector', () => {
      const v = [3, 4];
      const normalized = VectorOps.normalize(v);
      
      expect(normalized[0]).toBeCloseTo(0.6);
      expect(normalized[1]).toBeCloseTo(0.8);
    });

    it('should return same vector for zero vector', () => {
      const v = [0, 0, 0];
      const normalized = VectorOps.normalize(v);
      
      expect(normalized).toEqual(v);
    });
  });

  describe('add', () => {
    it('should add vectors', () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      
      expect(VectorOps.add(a, b)).toEqual([5, 7, 9]);
    });

    it('should return first vector for different lengths', () => {
      const a = [1, 2];
      const b = [1, 2, 3];
      
      expect(VectorOps.add(a, b)).toEqual(a);
    });
  });

  describe('subtract', () => {
    it('should subtract vectors', () => {
      const a = [5, 7, 9];
      const b = [1, 2, 3];
      
      expect(VectorOps.subtract(a, b)).toEqual([4, 5, 6]);
    });

    it('should return first vector for different lengths', () => {
      const a = [1, 2];
      const b = [1, 2, 3];
      
      expect(VectorOps.subtract(a, b)).toEqual(a);
    });
  });

  describe('scale', () => {
    it('should scale vector', () => {
      const v = [1, 2, 3];
      
      expect(VectorOps.scale(v, 2)).toEqual([2, 4, 6]);
    });
  });

  describe('dot', () => {
    it('should calculate dot product', () => {
      const a = [1, 2, 3];
      const b = [4, 5, 6];
      
      expect(VectorOps.dot(a, b)).toBe(32);
    });

    it('should return 0 for different length vectors', () => {
      const a = [1, 2];
      const b = [1, 2, 3];
      
      expect(VectorOps.dot(a, b)).toBe(0);
    });
  });

  describe('findNearest', () => {
    it('should find nearest neighbors', () => {
      const query = [1, 0, 0];
      const candidates = [
        { id: 'a', embedding: [0.9, 0.1, 0] },
        { id: 'b', embedding: [0.1, 0.9, 0] },
        { id: 'c', embedding: [0.8, 0.2, 0] },
      ];
      
      const nearest = VectorOps.findNearest(query, candidates, 2);
      
      expect(nearest).toHaveLength(2);
      expect(nearest[0].id).toBe('a');
      expect(nearest[0].similarity).toBeGreaterThan(nearest[1].similarity);
    });

    it('should handle k larger than candidates', () => {
      const query = [1, 0];
      const candidates = [
        { id: 'a', embedding: [1, 0] },
      ];
      
      const nearest = VectorOps.findNearest(query, candidates, 10);
      
      expect(nearest).toHaveLength(1);
    });
  });
});

describe('embeddingCache export', () => {
  it('should export singleton instance', () => {
    expect(embeddingCache).toBeInstanceOf(EmbeddingCache);
  });
});
