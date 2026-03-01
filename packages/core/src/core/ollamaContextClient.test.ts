/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OllamaContextClient } from './ollamaContextClient.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OllamaContextClient', () => {
  let client: OllamaContextClient;

  beforeEach(() => {
    client = new OllamaContextClient('http://localhost:11434', 30000);
    vi.clearAllMocks();
  });

  afterEach(() => {
    client.clearAllSessions();
  });

  describe('generate', () => {
    it('should make generate request without context for first message', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello! How can I help you?',
        done: true,
        context: [1, 2, 3, 4, 5],
        prompt_eval_count: 10,
        eval_count: 8,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello!',
        system: 'You are helpful.',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"prompt":"Hello!"'),
        }),
      );

      // Should include system prompt for first message
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are helpful.');
      expect(callBody.context).toBeUndefined();

      expect(result.response).toBe('Hello! How can I help you?');
      expect(result.contextReused).toBe(false);
      expect(result.context).toEqual([1, 2, 3, 4, 5]);
    });

    it('should include cached context for subsequent messages', async () => {
      // First message - set up context
      const firstResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3, 4, 5],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => firstResponse,
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello!',
        system: 'You are helpful.',
      });

      // Second message - should use context
      const secondResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:01Z',
        response: '2 + 2 equals 4.',
        done: true,
        context: [1, 2, 3, 4, 5, 6, 7, 8],
        prompt_eval_count: 3,
        eval_count: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse,
      });

      const result = await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'What is 2 + 2?',
      });

      // Should include cached context
      const callBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(callBody.context).toEqual([1, 2, 3, 4, 5]);

      // Should NOT include system prompt (already in context)
      expect(callBody.system).toBeUndefined();

      expect(result.contextReused).toBe(true);
    });

    it('should handle streaming responses', async () => {
      const chunks = [
        { model: 'llama3.2', created_at: '2025-01-01T00:00:00Z', response: 'Hello', done: false },
        { model: 'llama3.2', created_at: '2025-01-01T00:00:01Z', response: ' there', done: false },
        {
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:02Z',
          response: '!',
          done: true,
          context: [1, 2, 3],
        },
      ];

      let chunkIndex = 0;
      mockFetch.mockImplementation(async () => ({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (chunkIndex < chunks.length) {
                return {
                  done: false,
                  value: new TextEncoder().encode(JSON.stringify(chunks[chunkIndex++]) + '\n'),
                };
              }
              return { done: true, value: undefined };
            },
          }),
        },
      }));

      const receivedChunks: any[] = [];
      const result = await client.generateStream(
        {
          model: 'llama3.2',
          sessionId: 'test-session',
          prompt: 'Hello!',
        },
        (chunk) => receivedChunks.push(chunk),
      );

      expect(result.done).toBe(true);
      expect(result.context).toEqual([1, 2, 3]);
    });

    it('should handle errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        client.generate({
          model: 'llama3.2',
          sessionId: 'test-session',
          prompt: 'Hello!',
        }),
      ).rejects.toThrow();
    });
  });

  describe('session management', () => {
    it('should clear specific session', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'session-1',
        prompt: 'Hello!',
      });

      expect(client.hasContext('session-1')).toBe(true);

      client.clearSession('session-1');

      expect(client.hasContext('session-1')).toBe(false);
    });

    it('should clear all sessions', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'session-1',
        prompt: 'Hello!',
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'session-2',
        prompt: 'Hi!',
      });

      client.clearAllSessions();

      expect(client.hasContext('session-1')).toBe(false);
      expect(client.hasContext('session-2')).toBe(false);
    });

    it('should maintain separate contexts per session', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockResponse, context: [1, 2, 3] }),
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'session-1',
        prompt: 'Hello!',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockResponse, context: [4, 5, 6] }),
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'session-2',
        prompt: 'Hi!',
      });

      const session1 = client.getSession('session-1');
      const session2 = client.getSession('session-2');

      // Each session should have its own message count
      expect(session1?.messageCount).toBe(1);
      expect(session2?.messageCount).toBe(1);
    });
  });

  describe('cache statistics', () => {
    it('should track cache statistics', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3, 4, 5],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello!',
      });

      const stats = client.getCacheStats();
      
      expect(stats.cachedSessions).toBe(1);
      expect(stats.averageContextSize).toBe(5);
    });
  });

  describe('abort signal', () => {
    it('should pass abort signal to request', async () => {
      const controller = new AbortController();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Hello!',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello!',
        signal: controller.signal,
      });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.signal).toBe(controller.signal);
    });
  });
});
