/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextCacheManager } from './contextCacheManager.js';

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
  });
});
