/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextCacheManager, contextCacheManager } from './contextCacheManager.js';

describe('ContextCacheManager', () => {
  let cacheManager: ContextCacheManager;

  beforeEach(() => {
    cacheManager = new ContextCacheManager({
      maxSessions: 5,
      ttl: 60000, // 1 minute for tests
    });
  });

  afterEach(() => {
    cacheManager.clear();
  });

  describe('constructor', () => {
    it('should use default values when no config provided', () => {
      const defaultManager = new ContextCacheManager();
      const stats = defaultManager.getStats();
      
      expect(stats.cachedSessions).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customManager = new ContextCacheManager({
        maxSessions: 100,
        ttl: 3600000, // 1 hour
        maxContextTokens: 256000,
      });
      
      // Should not throw
      expect(customManager).toBeDefined();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(contextCacheManager).toBeInstanceOf(ContextCacheManager);
    });
  });

  describe('setContext', () => {
    it('should set context for a session', () => {
      const context = [1, 2, 3, 4, 5];
      cacheManager.setContext('session-1', context, 'llama3.2', 1);

      const retrieved = cacheManager.getContext('session-1');
      expect(retrieved).toEqual(context);
    });

    it('should update existing context', () => {
      const context1 = [1, 2, 3];
      const context2 = [1, 2, 3, 4, 5, 6];

      cacheManager.setContext('session-1', context1, 'llama3.2', 1);
      cacheManager.setContext('session-1', context2, 'llama3.2', 2);

      const retrieved = cacheManager.getContext('session-1');
      expect(retrieved).toEqual(context2);
    });

    it('should evict oldest session when maxSessions reached', () => {
      // Add 5 sessions (max)
      for (let i = 0; i < 5; i++) {
        cacheManager.setContext(`session-${i}`, [i], 'llama3.2', 1);
      }

      // Add one more - should evict oldest
      cacheManager.setContext('session-5', [5], 'llama3.2', 1);

      // First session should be evicted
      expect(cacheManager.getContext('session-0')).toBeNull();
      expect(cacheManager.getContext('session-5')).toEqual([5]);
    });
  });

  describe('getContext', () => {
    it('should return null for non-existent session', () => {
      expect(cacheManager.getContext('non-existent')).toBeNull();
    });

    it('should return null for expired context', async () => {
      // Create manager with very short TTL
      const shortTtlManager = new ContextCacheManager({ ttl: 10 });
      
      shortTtlManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(shortTtlManager.getContext('session-1')).toBeNull();
    });

    it('should update cache hits on successful retrieval', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      cacheManager.getContext('session-1');
      cacheManager.getContext('session-1');
      cacheManager.getContext('session-1');
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(3);
    });

    it('should update cache misses on failed retrieval', () => {
      cacheManager.getContext('non-existent');
      cacheManager.getContext('non-existent');
      
      const stats = cacheManager.getStats();
      expect(stats.misses).toBe(2);
    });
  });

  describe('hasContext', () => {
    it('should return true for valid context', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      expect(cacheManager.hasContext('session-1')).toBe(true);
    });

    it('should return false for non-existent context', () => {
      expect(cacheManager.hasContext('non-existent')).toBe(false);
    });

    it('should return false for invalidated context', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      cacheManager.invalidate('session-1');
      expect(cacheManager.hasContext('session-1')).toBe(false);
    });
  });

  describe('invalidate', () => {
    it('should invalidate existing context', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      cacheManager.invalidate('session-1');
      
      expect(cacheManager.getContext('session-1')).toBeNull();
    });

    it('should not throw for non-existent session', () => {
      expect(() => cacheManager.invalidate('non-existent')).not.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove context and session state', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      cacheManager.remove('session-1');
      
      expect(cacheManager.getContext('session-1')).toBeNull();
      expect(cacheManager.getCachedSessionIds()).not.toContain('session-1');
    });
  });

  describe('clear', () => {
    it('should clear all contexts', () => {
      cacheManager.setContext('session-1', [1], 'llama3.2', 1);
      cacheManager.setContext('session-2', [2], 'llama3.2', 1);
      cacheManager.setContext('session-3', [3], 'llama3.2', 1);
      
      cacheManager.clear();
      
      expect(cacheManager.getContext('session-1')).toBeNull();
      expect(cacheManager.getContext('session-2')).toBeNull();
      expect(cacheManager.getContext('session-3')).toBeNull();
      expect(cacheManager.getCachedSessionIds()).toHaveLength(0);
    });
  });

  describe('isContextCompatible', () => {
    it('should return true for same model', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      expect(cacheManager.isContextCompatible('session-1', 'llama3.2')).toBe(true);
    });

    it('should return false for different model', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      expect(cacheManager.isContextCompatible('session-1', 'llama2')).toBe(false);
    });

    it('should return false for non-existent session', () => {
      expect(cacheManager.isContextCompatible('non-existent', 'llama3.2')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      cacheManager.setContext('session-1', [1, 2, 3, 4, 5], 'llama3.2', 1);
      cacheManager.setContext('session-2', [1, 2, 3], 'llama3.2', 1);
      
      cacheManager.getContext('session-1'); // hit
      cacheManager.getContext('session-1'); // hit
      cacheManager.getContext('non-existent'); // miss
      
      const stats = cacheManager.getStats();
      
      expect(stats.cachedSessions).toBe(2);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.averageContextSize).toBe(4); // (5 + 3) / 2
    });
  });

  describe('estimateMemoryUsage', () => {
    it('should estimate memory correctly', () => {
      // Each number = 8 bytes (double precision)
      cacheManager.setContext('session-1', [1, 2, 3, 4, 5], 'llama3.2', 1);
      
      const memory = cacheManager.estimateMemoryUsage();
      expect(memory).toBe(40); // 5 numbers * 8 bytes
    });
  });

  describe('createGenerateRequest', () => {
    it('should include context for cached session', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      const request = cacheManager.createGenerateRequest(
        'session-1',
        'Hello',
        'llama3.2',
      );
      
      expect(request.context).toEqual([1, 2, 3]);
      expect(request.prompt).toBe('Hello');
    });

    it('should include system prompt for first message', () => {
      const request = cacheManager.createGenerateRequest(
        'session-1',
        'Hello',
        'llama3.2',
        'You are helpful.',
      );
      
      expect(request.context).toBeUndefined();
      expect(request.system).toBe('You are helpful.');
    });

    it('should not include system prompt when context exists', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      const request = cacheManager.createGenerateRequest(
        'session-1',
        'Hello',
        'llama3.2',
        'You are helpful.',
      );
      
      expect(request.context).toEqual([1, 2, 3]);
      expect(request.system).toBeUndefined();
    });
  });

  describe('handleGenerateResponse', () => {
    it('should cache context from response', () => {
      cacheManager.handleGenerateResponse(
        'session-1',
        { context: [1, 2, 3, 4, 5] },
        'llama3.2',
        1,
      );
      
      expect(cacheManager.getContext('session-1')).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle response without context', () => {
      cacheManager.handleGenerateResponse(
        'session-1',
        {},
        'llama3.2',
        1,
      );
      
      expect(cacheManager.getContext('session-1')).toBeNull();
    });
  });

  describe('Session state management', () => {
    it('should initialize session state', () => {
      cacheManager.initSession('session-1', 'llama3.2', 'Be helpful');
      
      const state = cacheManager.getSessionState('session-1');
      expect(state).toBeDefined();
      expect(state?.model).toBe('llama3.2');
      expect(state?.systemPrompt).toBe('Be helpful');
      expect(state?.messageCount).toBe(0);
    });

    it('should update session state', () => {
      cacheManager.initSession('session-1', 'llama3.2');
      cacheManager.updateSessionState('session-1', [1, 2, 3], 1);
      
      const state = cacheManager.getSessionState('session-1');
      expect(state?.context).toEqual([1, 2, 3]);
      expect(state?.messageCount).toBe(1);
    });

    it('should initialize session without system prompt', () => {
      cacheManager.initSession('session-1', 'llama3.2');
      
      const state = cacheManager.getSessionState('session-1');
      expect(state?.systemPrompt).toBeNull();
    });

    it('should update lastActivity on session state update', async () => {
      cacheManager.initSession('session-1', 'llama3.2');
      const initialTime = cacheManager.getSessionState('session-1')?.lastActivity;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cacheManager.updateSessionState('session-1', [1, 2, 3], 1);
      const updatedTime = cacheManager.getSessionState('session-1')?.lastActivity;
      
      expect(updatedTime).toBeGreaterThan(initialTime!);
    });
  });

  describe('edge cases', () => {
    it('should handle empty context array', () => {
      cacheManager.setContext('session-1', [], 'llama3.2', 1);
      
      // Empty context should still be stored but treated as no context
      const context = cacheManager.getContext('session-1');
      expect(context).toEqual([]);
    });

    it('should handle very large context arrays', () => {
      const largeContext = Array.from({ length: 10000 }, (_, i) => i);
      
      cacheManager.setContext('session-1', largeContext, 'llama3.2', 1);
      
      const retrieved = cacheManager.getContext('session-1');
      expect(retrieved).toHaveLength(10000);
    });

    it('should handle special characters in session ID', () => {
      const specialId = 'session-with-special-chars-!@#$%^&*()';
      
      cacheManager.setContext(specialId, [1, 2, 3], 'llama3.2', 1);
      
      expect(cacheManager.getContext(specialId)).toEqual([1, 2, 3]);
    });

    it('should handle unicode in session ID', () => {
      const unicodeId = 'session-日本語-😀';
      
      cacheManager.setContext(unicodeId, [1, 2, 3], 'llama3.2', 1);
      
      expect(cacheManager.getContext(unicodeId)).toEqual([1, 2, 3]);
    });

    it('should handle model name with version', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2:latest', 1);
      
      expect(cacheManager.isContextCompatible('session-1', 'llama3.2:latest')).toBe(true);
      expect(cacheManager.isContextCompatible('session-1', 'llama3.2')).toBe(false);
    });

    it('should correctly calculate memory for multiple sessions', () => {
      cacheManager.setContext('session-1', [1, 2, 3, 4, 5], 'llama3.2', 1); // 40 bytes
      cacheManager.setContext('session-2', [1, 2, 3], 'llama3.2', 1); // 24 bytes
      cacheManager.setContext('session-3', [1, 2, 3, 4, 5, 6, 7, 8], 'llama3.2', 1); // 64 bytes
      
      const memory = cacheManager.estimateMemoryUsage();
      expect(memory).toBe(128); // 40 + 24 + 64
    });

    it('should handle rapid sequential context updates', () => {
      for (let i = 0; i < 100; i++) {
        cacheManager.setContext('session-1', [i], 'llama3.2', i);
      }
      
      const context = cacheManager.getContext('session-1');
      expect(context).toEqual([99]);
    });

    it('should handle invalidate followed by setContext', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      cacheManager.invalidate('session-1');
      
      // Should be able to set new context after invalidation
      cacheManager.setContext('session-1', [4, 5, 6], 'llama3.2', 2);
      
      expect(cacheManager.getContext('session-1')).toEqual([4, 5, 6]);
    });

    it('should track invalidations in stats', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      cacheManager.setContext('session-2', [4, 5, 6], 'llama3.2', 1);
      
      cacheManager.invalidate('session-1');
      cacheManager.invalidate('session-2');
      
      const stats = cacheManager.getStats();
      expect(stats.invalidations).toBe(2);
    });

    it('should update average context size correctly after removal', () => {
      cacheManager.setContext('session-1', [1, 2, 3, 4, 5], 'llama3.2', 1); // avg 5
      cacheManager.setContext('session-2', [1, 2, 3], 'llama3.2', 1); // avg 4
      
      cacheManager.remove('session-1');
      
      const stats = cacheManager.getStats();
      expect(stats.averageContextSize).toBe(3); // Only session-2 left
    });
  });

  describe('eviction policy', () => {
    it('should evict oldest session based on timestamp', async () => {
      // Create sessions with small delays to ensure different timestamps
      cacheManager.setContext('session-1', [1], 'llama3.2', 1);
      await new Promise(resolve => setTimeout(resolve, 5));
      cacheManager.setContext('session-2', [2], 'llama3.2', 1);
      await new Promise(resolve => setTimeout(resolve, 5));
      cacheManager.setContext('session-3', [3], 'llama3.2', 1);
      await new Promise(resolve => setTimeout(resolve, 5));
      cacheManager.setContext('session-4', [4], 'llama3.2', 1);
      await new Promise(resolve => setTimeout(resolve, 5));
      cacheManager.setContext('session-5', [5], 'llama3.2', 1);
      
      // Add one more - should evict session-1 (oldest)
      cacheManager.setContext('session-6', [6], 'llama3.2', 1);
      
      expect(cacheManager.getContext('session-1')).toBeNull();
      expect(cacheManager.getContext('session-2')).not.toBeNull();
    });

    it('should not evict when updating existing session', () => {
      cacheManager.setContext('session-1', [1], 'llama3.2', 1);
      cacheManager.setContext('session-2', [2], 'llama3.2', 1);
      cacheManager.setContext('session-3', [3], 'llama3.2', 1);
      cacheManager.setContext('session-4', [4], 'llama3.2', 1);
      cacheManager.setContext('session-5', [5], 'llama3.2', 1);
      
      // Update existing - should not trigger eviction
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 2);
      
      // All sessions should still exist
      expect(cacheManager.getCachedSessionIds()).toHaveLength(5);
    });

    it('should correctly maintain cache size after multiple evictions', () => {
      // Fill cache
      for (let i = 0; i < 5; i++) {
        cacheManager.setContext(`session-${i}`, [i], 'llama3.2', 1);
      }
      
      // Add more sessions causing evictions
      for (let i = 5; i < 10; i++) {
        cacheManager.setContext(`session-${i}`, [i], 'llama3.2', 1);
      }
      
      // Cache should still have max 5 sessions
      expect(cacheManager.getCachedSessionIds()).toHaveLength(5);
    });
  });

  describe('createGenerateRequest edge cases', () => {
    it('should handle incompatible model', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      // Request with different model
      const request = cacheManager.createGenerateRequest(
        'session-1',
        'Hello',
        'llama2', // Different model
        'System prompt',
      );
      
      // Should not include context (incompatible model)
      expect(request.context).toBeUndefined();
      // Should include system prompt
      expect(request.system).toBe('System prompt');
    });

    it('should handle session with cached context but no system prompt', () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      const request = cacheManager.createGenerateRequest(
        'session-1',
        'Hello',
        'llama3.2',
      );
      
      expect(request.context).toEqual([1, 2, 3]);
      expect(request.system).toBeUndefined();
    });
  });

  describe('concurrent access simulation', () => {
    it('should handle concurrent reads', async () => {
      cacheManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      // Simulate concurrent reads
      const reads = await Promise.all([
        Promise.resolve(cacheManager.getContext('session-1')),
        Promise.resolve(cacheManager.getContext('session-1')),
        Promise.resolve(cacheManager.getContext('session-1')),
        Promise.resolve(cacheManager.getContext('session-1')),
        Promise.resolve(cacheManager.getContext('session-1')),
      ]);
      
      // All reads should return the same context
      reads.forEach(context => {
        expect(context).toEqual([1, 2, 3]);
      });
      
      // Hits should be 5
      expect(cacheManager.getStats().hits).toBe(5);
    });

    it('should handle concurrent writes to different sessions', async () => {
      // Concurrent writes to different sessions
      await Promise.all([
        Promise.resolve(cacheManager.setContext('session-1', [1], 'llama3.2', 1)),
        Promise.resolve(cacheManager.setContext('session-2', [2], 'llama3.2', 1)),
        Promise.resolve(cacheManager.setContext('session-3', [3], 'llama3.2', 1)),
      ]);
      
      expect(cacheManager.getCachedSessionIds()).toHaveLength(3);
    });
  });

  describe('TTL behavior', () => {
    it('should respect custom TTL per manager instance', async () => {
      const shortTtlManager = new ContextCacheManager({ ttl: 20 });
      const longTtlManager = new ContextCacheManager({ ttl: 10000 });
      
      shortTtlManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      longTtlManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(shortTtlManager.getContext('session-1')).toBeNull();
      expect(longTtlManager.getContext('session-1')).toEqual([1, 2, 3]);
    });

    it('should update cache stats correctly on TTL expiry', async () => {
      const shortTtlManager = new ContextCacheManager({ ttl: 10 });
      
      shortTtlManager.setContext('session-1', [1, 2, 3], 'llama3.2', 1);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Access expired context
      shortTtlManager.getContext('session-1');
      
      const stats = shortTtlManager.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.invalidations).toBe(1);
    });
  });
});
