/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OllamaContextClient, ollamaContextClient } from './ollamaContextClient.js';

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

  describe('constructor', () => {
    it('should create client with default settings', () => {
      const defaultClient = new OllamaContextClient();
      expect(defaultClient).toBeDefined();
    });

    it('should create client with custom settings', () => {
      const customClient = new OllamaContextClient('http://custom:8080', 60000);
      expect(customClient).toBeDefined();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(ollamaContextClient).toBeInstanceOf(OllamaContextClient);
    });
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
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null,
        },
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
      expect(callArgs.signal).toBeDefined();
      expect(callArgs.signal.aborted).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
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

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          }),
      );

      await expect(
        client.generate({
          model: 'llama3.2',
          sessionId: 'test-session',
          prompt: 'Hello!',
        }),
      ).rejects.toThrow();
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        client.generate({
          model: 'llama3.2',
          sessionId: 'test-session',
          prompt: 'Hello!',
        }),
      ).rejects.toThrow();
    });

    it('should handle 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        client.generate({
          model: 'llama3.2',
          sessionId: 'test-session',
          prompt: 'Hello!',
        }),
      ).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Model not found',
      });

      await expect(
        client.generate({
          model: 'nonexistent-model',
          sessionId: 'test-session',
          prompt: 'Hello!',
        }),
      ).rejects.toThrow();
    });

    it('should handle streaming error mid-stream', async () => {
      let chunkIndex = 0;
      const chunks = [
        { model: 'llama3.2', created_at: '2025-01-01T00:00:00Z', response: 'Hello', done: false },
      ];

      mockFetch.mockImplementation(async () => ({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (chunkIndex < chunks.length) {
                chunkIndex++;
                return {
                  done: false,
                  value: new TextEncoder().encode(JSON.stringify(chunks[0]) + '\n'),
                };
              }
              // Simulate error mid-stream
              throw new Error('Stream interrupted');
            },
          }),
        },
      }));

      await expect(
        client.generateStream(
          {
            model: 'llama3.2',
            sessionId: 'test-session',
            prompt: 'Hello!',
          },
          () => {},
        ),
      ).rejects.toThrow();
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: '',
          done: true,
          context: [],
        }),
      });

      const result = await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello!',
      });

      expect(result.response).toBe('');
      expect(result.context).toEqual([]);
    });
  });

  describe('request options', () => {
    it('should pass model options to request', async () => {
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
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_ctx: 4096,
        },
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.options.temperature).toBe(0.7);
      expect(callBody.options.top_p).toBe(0.9);
      expect(callBody.options.num_ctx).toBe(4096);
    });

    it('should handle images in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'I see an image!',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'What is in this image?',
        images: ['base64imagedata'],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.images).toEqual(['base64imagedata']);
    });

    it('should handle format parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: '{"result": "success"}',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Return JSON',
        format: 'json',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.format).toBe('json');
    });

    it('should handle keep_alive parameter', async () => {
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
        keep_alive: '10m',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.keep_alive).toBe('10m');
    });

    it('should handle raw mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Raw response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello!',
        raw: true,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.raw).toBe(true);
    });
  });

  describe('response handling', () => {
    it('should include all response fields', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3, 4, 5],
        total_duration: 1000000000,
        load_duration: 500000000,
        prompt_eval_count: 10,
        prompt_eval_duration: 200000000,
        eval_count: 5,
        eval_duration: 300000000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello!',
      });

      expect(result.model).toBe('llama3.2');
      expect(result.created_at).toBe('2025-01-01T00:00:00Z');
      expect(result.response).toBe('Hello!');
      expect(result.done).toBe(true);
      expect(result.context).toEqual([1, 2, 3, 4, 5]);
      expect(result.total_duration).toBe(1000000000);
      expect(result.load_duration).toBe(500000000);
      expect(result.prompt_eval_count).toBe(10);
      expect(result.prompt_eval_duration).toBe(200000000);
      expect(result.eval_count).toBe(5);
      expect(result.eval_duration).toBe(300000000);
      expect(result.sessionId).toBe('test-session');
    });

    it('should increment message count after successful generation', async () => {
      mockFetch.mockResolvedValue({
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
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hi again!',
      });

      const session = client.getSession('test-session');
      expect(session?.messageCount).toBe(2);
    });
  });

  describe('getClient', () => {
    it('should return underlying client', () => {
      const nativeClient = client.getClient();
      expect(nativeClient).toBeDefined();
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent requests to different sessions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Hello!',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await Promise.all([
        client.generate({ model: 'llama3.2', sessionId: 'session-1', prompt: 'Hello!' }),
        client.generate({ model: 'llama3.2', sessionId: 'session-2', prompt: 'Hi!' }),
        client.generate({ model: 'llama3.2', sessionId: 'session-3', prompt: 'Hey!' }),
      ]);

      expect(client.hasContext('session-1')).toBe(true);
      expect(client.hasContext('session-2')).toBe(true);
      expect(client.hasContext('session-3')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response with special chars',
          done: true,
          context: [1, 2, 3],
        }),
      });

      const result = await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello! \n\t "quotes" \'apostrophes\' \\backslash\\',
      });

      expect(result.response).toBe('Response with special chars');
    });

    it('should handle unicode in prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Unicode response: 日本語',
          done: true,
          context: [1, 2, 3],
        }),
      });

      const result = await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Привет! 日本語! 😀',
      });

      expect(result.response).toContain('日本語');
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(10000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Processed long prompt',
          done: true,
          context: [1, 2, 3],
        }),
      });

      const result = await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: longPrompt,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.prompt).toBe(longPrompt);
      expect(result.response).toBe('Processed long prompt');
    });

    it('should handle large context arrays', async () => {
      const largeContext = Array.from({ length: 8000 }, (_, i) => i);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Hello!',
          done: true,
          context: largeContext,
        }),
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Hello!',
      });

      // Second request should include the large context
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:01Z',
          response: 'Follow-up',
          done: true,
          context: [...largeContext, 8000, 8001],
        }),
      });

      await client.generate({
        model: 'llama3.2',
        sessionId: 'test-session',
        prompt: 'Follow-up',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(callBody.context).toEqual(largeContext);
    });
  });
});
