/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for OllamaNativeContentGenerator.
 * Tests the content generator that uses native Ollama API.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OllamaNativeContentGenerator } from './ollamaNativeContentGenerator.js';
import { AuthType, type ContentGeneratorConfig } from '../contentGenerator.js';
import type { Config } from '../../config/config.js';
import type { GenerateContentParameters } from '@google/genai';

// Mock dependencies
vi.mock('../ollamaNativeClient.js', () => ({
  OllamaNativeClient: vi.fn().mockImplementation(() => ({
    chat: vi.fn(),
    generate: vi.fn(),
    embed: vi.fn(),
    embeddings: vi.fn(),
    listModels: vi.fn(),
    showModel: vi.fn(),
    getVersion: vi.fn(),
    isServerRunning: vi.fn(),
    isModelAvailable: vi.fn(),
  })),
  DEFAULT_OLLAMA_NATIVE_URL: 'http://localhost:11434',
}));

vi.mock('../../utils/request-tokenizer/index.js', () => ({
  RequestTokenEstimator: vi.fn().mockImplementation(() => ({
    calculateTokens: vi.fn().mockResolvedValue({ totalTokens: 100 }),
  })),
}));

vi.mock('../../config/models.js', () => ({
  DEFAULT_OLLAMA_EMBEDDING_MODEL: 'nomic-embed-text',
}));

// Helper to create mock config
function createMockConfig(): Config {
  return {
    getProxy: vi.fn().mockReturnValue(undefined),
    getAuthType: vi.fn().mockReturnValue(AuthType.USE_OLLAMA),
  } as unknown as Config;
}

// Helper to create generator config
function createGeneratorConfig(overrides: Partial<ContentGeneratorConfig> = {}): ContentGeneratorConfig {
  return {
    model: 'llama3.2',
    authType: AuthType.USE_OLLAMA,
    ...overrides,
  };
}

describe('OllamaNativeContentGenerator', () => {
  let generator: OllamaNativeContentGenerator;
  let mockConfig: Config;
  let mockClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockConfig = createMockConfig();
    const generatorConfig = createGeneratorConfig();

    generator = new OllamaNativeContentGenerator(generatorConfig, mockConfig);

    // Get the mocked client instance
    const { OllamaNativeClient } = await import('../ollamaNativeClient.js');
    mockClient = (OllamaNativeClient as any).mock.results[0].value;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default settings', () => {
      expect(generator).toBeDefined();
    });

    it('should create instance with custom base URL', async () => {
      const { OllamaNativeClient } = await import('../ollamaNativeClient.js');

      new OllamaNativeContentGenerator(
        createGeneratorConfig({ baseUrl: 'http://custom:11434' }),
        mockConfig
      );

      expect(OllamaNativeClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: 'http://custom:11434',
        })
      );
    });

    it('should create instance with custom timeout', async () => {
      const { OllamaNativeClient } = await import('../ollamaNativeClient.js');

      new OllamaNativeContentGenerator(
        createGeneratorConfig({ timeout: 60000 }),
        mockConfig
      );

      expect(OllamaNativeClient).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });
  });

  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      mockClient.chat.mockResolvedValueOnce({
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello, World!',
        },
        done: true,
        prompt_eval_count: 10,
        eval_count: 5,
      });

      const request: GenerateContentParameters = {
        model: 'llama3.2',
        contents: [
          { role: 'user', parts: [{ text: 'Hello!' }] },
        ],
      };

      const result = await generator.generateContent(request, 'test-prompt-id');

      expect(result.candidates).toBeDefined();
      expect(result.candidates?.[0]?.content?.parts).toHaveLength(1);
      expect(result.modelVersion).toBe('llama3.2');
    });

    it('should handle tools in request', async () => {
      mockClient.chat.mockResolvedValueOnce({
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              function: {
                name: 'get_weather',
                arguments: { location: 'SF' },
              },
            },
          ],
        },
        done: true,
      });

      const request: GenerateContentParameters = {
        model: 'llama3.2',
        contents: [
          { role: 'user', parts: [{ text: 'What is the weather?' }] },
        ],
        config: {
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'get_weather',
                  description: 'Get weather',
                  parametersJsonSchema: { type: 'object' },
                },
              ],
            },
          ],
        },
      };

      const result = await generator.generateContent(request, 'test-prompt-id');

      // Check that tools were passed to client
      expect(mockClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.arrayContaining([
            expect.objectContaining({
              type: 'function',
            }),
          ]),
        })
      );

      expect(result.candidates?.[0]?.content?.parts).toHaveLength(1);
    });

    it('should apply sampling parameters', async () => {
      mockClient.chat.mockResolvedValueOnce({
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'Test' },
        done: true,
      });

      const generatorWithSampling = new OllamaNativeContentGenerator(
        createGeneratorConfig({
          samplingParams: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 100,
          },
        }),
        mockConfig
      );

      await generatorWithSampling.generateContent(
        { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
        'test-id'
      );

      // Verify sampling params were applied
      const lastCall = mockClient.chat.mock.calls[mockClient.chat.mock.calls.length - 1];
      expect(lastCall[0].options).toMatchObject({
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 100,
      });
    });

    it('should handle errors gracefully', async () => {
      mockClient.chat.mockRejectedValueOnce(new Error('Ollama connection failed'));

      const request: GenerateContentParameters = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
      };

      await expect(generator.generateContent(request, 'test-id')).rejects.toThrow(
        'Ollama API error'
      );
    });

    it('should handle abort signal', async () => {
      const abortError = new Error('Aborted');
      (abortError as any).name = 'AbortError';

      mockClient.chat.mockRejectedValueOnce(abortError);

      const controller = new AbortController();
      controller.abort();

      const request: GenerateContentParameters = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
        config: {
          abortSignal: controller.signal,
        },
      };

      await expect(generator.generateContent(request, 'test-id')).rejects.toThrow();
    });
  });

  describe('generateContentStream', () => {
    it('should return async generator', async () => {
      mockClient.chat.mockImplementationOnce(async (_request: any, callback: any) => {
        if (callback) {
          callback({
            model: 'llama3.2',
            message: { role: 'assistant', content: 'Hello' },
            done: false,
          });
          callback({
            model: 'llama3.2',
            message: { role: 'assistant', content: ' World' },
            done: false,
          });
          callback({
            model: 'llama3.2',
            message: { role: 'assistant', content: '!' },
            done: true,
          });
        }
      });

      const request: GenerateContentParameters = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }],
      };

      const stream = await generator.generateContentStream(request, 'test-id');
      const results = [];

      for await (const chunk of stream) {
        results.push(chunk);
      }

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('countTokens', () => {
    it('should estimate tokens', async () => {
      const request = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [{ text: 'Hello, World!' }] }],
      };

      const result = await generator.countTokens(request);

      expect(result.totalTokens).toBeDefined();
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should handle complex content', async () => {
      const request = {
        model: 'llama3.2',
        contents: [
          { role: 'user', parts: [{ text: 'Hello!' }] },
          { role: 'model', parts: [{ text: 'Hi there!' }] },
          { role: 'user', parts: [{ text: 'How are you?' }] },
        ],
      };

      const result = await generator.countTokens(request);

      expect(result.totalTokens).toBeDefined();
    });
  });

  describe('embedContent', () => {
    it('should generate embeddings', async () => {
      mockClient.embed.mockResolvedValueOnce({
        model: 'nomic-embed-text',
        embeddings: [[0.1, 0.2, 0.3, 0.4]],
      });

      const request = {
        model: 'nomic-embed-text',
        contents: ['Hello, World!'],
      };

      const result = await generator.embedContent(request);

      expect(result.embeddings).toBeDefined();
      expect(result.embeddings).toHaveLength(1);
      expect(result.embeddings?.[0]?.values).toEqual([0.1, 0.2, 0.3, 0.4]);
    });

    it('should handle array contents', async () => {
      mockClient.embed.mockResolvedValueOnce({
        model: 'nomic-embed-text',
        embeddings: [[0.1, 0.2], [0.3, 0.4]],
      });

      const request = {
        model: 'nomic-embed-text',
        contents: [
          { role: 'user', parts: [{ text: 'Hello' }] },
          { role: 'user', parts: [{ text: 'World' }] },
        ],
      };

      await generator.embedContent(request);

      expect(mockClient.embed).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.stringContaining('Hello'),
        })
      );
    });

    it('should handle embedding errors', async () => {
      mockClient.embed.mockRejectedValueOnce(new Error('Model not found'));

      await expect(
        generator.embedContent({ model: 'test', contents: ['Test'] })
      ).rejects.toThrow('Ollama embedding error');
    });
  });

  describe('useSummarizedThinking', () => {
    it('should return false (not supported in native Ollama)', () => {
      expect(generator.useSummarizedThinking()).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should apply context window size', async () => {
      mockClient.chat.mockResolvedValueOnce({
        model: 'llama3.2',
        message: { role: 'assistant', content: 'Test' },
        done: true,
      });

      const generatorWithContext = new OllamaNativeContentGenerator(
        createGeneratorConfig({ contextWindowSize: 4096 }),
        mockConfig
      );

      await generatorWithContext.generateContent(
        { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
        'test-id'
      );

      const lastCall = mockClient.chat.mock.calls[mockClient.chat.mock.calls.length - 1];
      expect(lastCall[0].options?.num_ctx).toBe(4096);
    });

    it('should apply repetition penalty', async () => {
      mockClient.chat.mockResolvedValueOnce({
        model: 'llama3.2',
        message: { role: 'assistant', content: 'Test' },
        done: true,
      });

      const generatorWithPenalty = new OllamaNativeContentGenerator(
        createGeneratorConfig({
          samplingParams: {
            repetition_penalty: 1.1,
            presence_penalty: 0.5,
            frequency_penalty: 0.3,
          },
        }),
        mockConfig
      );

      await generatorWithPenalty.generateContent(
        { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
        'test-id'
      );

      const lastCall = mockClient.chat.mock.calls[mockClient.chat.mock.calls.length - 1];
      expect(lastCall[0].options?.repeat_penalty).toBe(1.1);
      expect(lastCall[0].options?.presence_penalty).toBe(0.5);
      expect(lastCall[0].options?.frequency_penalty).toBe(0.3);
    });
  });

  describe('Error Recovery', () => {
    it('should provide meaningful error messages', async () => {
      mockClient.chat.mockRejectedValueOnce(new Error('Model llama3.2 not found'));

      await expect(
        generator.generateContent(
          { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
          'test-id'
        )
      ).rejects.toThrow('Model llama3.2 not found');
    });

    it('should handle network errors', async () => {
      mockClient.chat.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        generator.generateContent(
          { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
          'test-id'
        )
      ).rejects.toThrow();
    });
  });
});
