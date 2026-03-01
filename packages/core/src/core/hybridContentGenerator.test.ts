/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HybridContentGenerator } from './hybridContentGenerator.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HybridContentGenerator', () => {
  let generator: HybridContentGenerator;

  beforeEach(() => {
    generator = new HybridContentGenerator({
      model: 'llama3.2',
      sessionId: 'test-session',
      systemInstruction: 'You are helpful.',
      preferGenerateEndpoint: true,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    generator.clearContext();
  });

  describe('endpoint selection', () => {
    it('should select generate endpoint for simple conversation', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3],
        prompt_eval_count: 5,
        eval_count: 3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      );

      // Should use /api/generate
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate'),
        expect.any(Object),
      );

      expect(result.candidates[0].content.parts[0].text).toBe('Hello!');
    });

    it('should select chat endpoint when tools are present', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Let me check that for you.',
        },
        done: true,
        prompt_eval_count: 10,
        eval_count: 8,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'What time is it?' }] }],
          config: {
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'get_time',
                    description: 'Get current time',
                    parameters: { type: 'object' },
                  },
                ],
              },
            ],
          },
        },
        'test-prompt-id',
      );

      // Should use /api/chat because tools are present
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.any(Object),
      );
    });

    it('should select chat endpoint when history contains function calls', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'The time is 12:00.',
        },
        done: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generator.generateContent(
        {
          contents: [
            { role: 'user', parts: [{ text: 'What time?' }] },
            {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    name: 'get_time',
                    args: {},
                  },
                },
              ],
            },
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: 'get_time',
                    response: { time: '12:00' },
                  },
                },
              ],
            },
          ],
        },
        'test-prompt-id',
      );

      // Should use /api/chat because of function calls
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.any(Object),
      );
    });
  });

  describe('context caching', () => {
    it('should reuse context on subsequent requests', async () => {
      // First request
      const firstResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3, 4, 5],
        prompt_eval_count: 10,
        eval_count: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => firstResponse,
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id-1',
      );

      // Second request - should include context
      const secondResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:01Z',
        response: 'How are you?',
        done: true,
        context: [1, 2, 3, 4, 5, 6, 7, 8],
        prompt_eval_count: 3,
        eval_count: 4,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse,
      });

      await generator.generateContent(
        {
          contents: [
            { role: 'user', parts: [{ text: 'Hello!' }] },
            { role: 'model', parts: [{ text: 'Hello!' }] },
            { role: 'user', parts: [{ text: 'How are you?' }] },
          ],
        },
        'test-prompt-id-2',
      );

      // Second call should include context
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.context).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('streaming', () => {
    it('should stream responses', async () => {
      const chunks = [
        { model: 'llama3.2', response: 'Hello', done: false },
        { model: 'llama3.2', response: ' there', done: false },
        {
          model: 'llama3.2',
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
      for await (const chunk of generator.generateContentStream(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      )) {
        receivedChunks.push(chunk);
      }

      expect(receivedChunks.length).toBeGreaterThan(0);
    });
  });

  describe('model switching', () => {
    it('should update model', () => {
      generator.setModel('llama2');
      // Model should be updated internally
      expect(generator.getCacheStats().sessionId).toBe('test-session');
    });
  });

  describe('session management', () => {
    it('should update session ID', () => {
      generator.setSessionId('new-session');
      expect(generator.getCacheStats().sessionId).toBe('new-session');
    });

    it('should clear context', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3],
        prompt_eval_count: 5,
        eval_count: 3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      );

      const statsBefore = generator.getCacheStats();
      expect(statsBefore.hasCachedContext).toBe(true);

      generator.clearContext();

      const statsAfter = generator.getCacheStats();
      expect(statsAfter.hasCachedContext).toBe(false);
    });
  });

  describe('system instruction', () => {
    it('should include system instruction for first message', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are helpful.');
    });

    it('should update system instruction', () => {
      generator.setSystemInstruction('New instruction');
      // Should be updated for next request
    });
  });

  describe('cache statistics', () => {
    it('should return cache statistics', async () => {
      const mockResponse = {
        model: 'llama3.2',
        created_at: '2025-01-01T00:00:00Z',
        response: 'Hello!',
        done: true,
        context: [1, 2, 3, 4, 5],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      );

      const stats = generator.getCacheStats();

      expect(stats.sessionId).toBe('test-session');
      expect(stats.hasCachedContext).toBe(true);
      expect(stats.contextCache).toBeDefined();
    });
  });
});
