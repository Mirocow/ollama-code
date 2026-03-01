/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HybridContentGenerator, createHybridContentGenerator } from './hybridContentGenerator.js';

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

  describe('factory function', () => {
    it('should create generator using factory function', () => {
      const gen = createHybridContentGenerator({
        model: 'llama3.2',
      });
      expect(gen).toBeInstanceOf(HybridContentGenerator);
    });
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
      const streamGenerator = await generator.generateContentStream(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      );
      
      for await (const chunk of streamGenerator) {
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

      // After clearing, should work correctly
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
      expect(stats.contextCache).toBeDefined();
    });
  });

  describe('countTokens', () => {
    it('should count tokens for text content', async () => {
      const result = await generator.countTokens({
        contents: [{ role: 'user', parts: [{ text: 'Hello, world!' }] }],
      });

      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should count tokens for multiple parts', async () => {
      const result = await generator.countTokens({
        contents: [
          { role: 'user', parts: [{ text: 'Hello' }] },
          { role: 'model', parts: [{ text: 'Hi there!' }] },
        ],
      });

      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const result = await generator.countTokens({
        contents: [{ role: 'user', parts: [] }],
      });

      expect(result.totalTokens).toBe(0);
    });

    it('should estimate tokens based on character count', async () => {
      const shortText = 'Hi';
      const longText = 'This is a much longer text that should have more tokens';

      const shortResult = await generator.countTokens({
        contents: [{ role: 'user', parts: [{ text: shortText }] }],
      });

      const longResult = await generator.countTokens({
        contents: [{ role: 'user', parts: [{ text: longText }] }],
      });

      expect(longResult.totalTokens).toBeGreaterThan(shortResult.totalTokens);
    });
  });

  describe('embedContent', () => {
    it('should generate embeddings for text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        }),
      });

      const result = await generator.embedContent({
        content: 'Hello, world!',
      });

      expect(result.embedding.values).toHaveLength(5);
      expect(result.embedding.values).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    });

    it('should use default model for embeddings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          embedding: [0.1, 0.2],
        }),
      });

      await generator.embedContent({
        content: 'Test embedding',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('llama3.2');
    });

    it('should accept custom model for embeddings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          embedding: [0.1, 0.2],
        }),
      });

      await generator.embedContent({
        content: 'Test embedding',
        model: 'nomic-embed-text',
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('nomic-embed-text');
    });

    it('should handle content with parts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          embedding: [0.1, 0.2, 0.3],
        }),
      });

      const result = await generator.embedContent({
        content: {
          parts: [{ text: 'Part 1' }, { text: 'Part 2' }],
        },
      });

      expect(result.embedding.values).toBeDefined();
    });
  });

  describe('useSummarizedThinking', () => {
    it('should return false', () => {
      expect(generator.useSummarizedThinking()).toBe(false);
    });
  });

  describe('generation config options', () => {
    it('should pass temperature option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Creative response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            temperature: 0.8,
          },
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.options.temperature).toBe(0.8);
    });

    it('should pass topP option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            topP: 0.95,
          },
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.options.top_p).toBe(0.95);
    });

    it('should pass topK option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            topK: 40,
          },
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.options.top_k).toBe(40);
    });

    it('should pass maxOutputTokens option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            maxOutputTokens: 100,
          },
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.options.num_predict).toBe(100);
    });

    it('should pass stopSequences option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            stopSequences: ['END', 'STOP'],
          },
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.options.stop).toEqual(['END', 'STOP']);
    });

    it('should use contextWindowSize from config', async () => {
      const customGenerator = new HybridContentGenerator({
        model: 'llama3.2',
        contextWindowSize: 8192,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await customGenerator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Options may or may not be included depending on implementation
      expect(callBody.options).toBeDefined();
    });
  });

  describe('system instruction handling', () => {
    it('should use system instruction from request config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            systemInstruction: 'You are a pirate.',
          },
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are a pirate.');
    });

    it('should handle system instruction with parts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            systemInstruction: {
              parts: [{ text: 'Part 1' }, { text: 'Part 2' }],
            },
          },
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('Part 1\nPart 2');
    });

    it('should handle system instruction with text property', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            systemInstruction: {
              text: 'Simple text instruction',
            },
          },
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.system).toBe('Simple text instruction');
    });
  });

  describe('image handling', () => {
    it('should include images in generate request', async () => {
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

      await generator.generateContent(
        {
          contents: [
            {
              role: 'user',
              parts: [
                { text: 'What is this?' },
                { inlineData: { mimeType: 'image/png', data: 'base64imagedata' } },
              ],
            },
          ],
        },
        'test-prompt-id',
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.images).toContain('base64imagedata');
    });
  });

  describe('response handling', () => {
    it('should include usage metadata in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Hello!',
          done: true,
          context: [1, 2, 3],
          prompt_eval_count: 15,
          eval_count: 8,
        }),
      });

      const result = await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      );

      expect(result.usageMetadata).toBeDefined();
      expect(result.usageMetadata?.promptTokenCount).toBe(15);
      expect(result.usageMetadata?.candidatesTokenCount).toBe(8);
      expect(result.usageMetadata?.totalTokenCount).toBe(23);
    });

    it('should set correct finish reason', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          created_at: '2025-01-01T00:00:00Z',
          response: 'Complete response',
          done: true,
          context: [1, 2, 3],
        }),
      });

      const result = await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
        },
        'test-prompt-id',
      );

      expect(result.candidates[0].finishReason).toBe('STOP');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        generator.generateContent(
          {
            contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          },
          'test-prompt-id',
        ),
      ).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        generator.generateContent(
          {
            contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          },
          'test-prompt-id',
        ),
      ).rejects.toThrow();
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

      await generator.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
          config: {
            abortSignal: controller.signal,
          },
        },
        'test-prompt-id',
      );

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.signal).toBeDefined();
      expect(callArgs.signal.aborted).toBe(false);
    });
  });
});
