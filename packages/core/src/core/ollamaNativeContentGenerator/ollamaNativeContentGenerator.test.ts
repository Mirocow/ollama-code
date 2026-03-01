/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for OllamaNativeContentGenerator.
 * Tests the content generator that uses native Ollama API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaNativeContentGenerator } from './ollamaNativeContentGenerator.js';
import { AuthType, type ContentGeneratorConfig } from '../contentGenerator.js';
import type { Config } from '../../config/config.js';
import type { GenerateContentParameters } from '../types/content.js';

// Create mock functions
const mockChat = vi.fn();
const mockGenerate = vi.fn();
const mockEmbed = vi.fn();
const mockEmbeddings = vi.fn();

// Mock dependencies
vi.mock('../ollamaNativeClient.js', () => ({
  OllamaNativeClient: vi.fn().mockImplementation(() => ({
    chat: mockChat,
    generate: mockGenerate,
    embed: mockEmbed,
    embeddings: mockEmbeddings,
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
  const mockConfig = createMockConfig();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default settings', () => {
      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
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
      mockChat.mockResolvedValueOnce({
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

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
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
      mockChat.mockResolvedValueOnce({
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

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
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

      expect(mockChat).toHaveBeenCalledWith(
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
      mockChat.mockResolvedValueOnce({
        model: 'llama3.2',
        message: { role: 'assistant', content: 'Test' },
        done: true,
      });

      const generator = new OllamaNativeContentGenerator(
        createGeneratorConfig({
          samplingParams: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 100,
          },
        }),
        mockConfig
      );

      await generator.generateContent(
        { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
        'test-id'
      );

      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 100,
          }),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockChat.mockRejectedValueOnce(new Error('Ollama connection failed'));

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
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

      mockChat.mockRejectedValueOnce(abortError);

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
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
      mockChat.mockImplementationOnce(async (_request: any, callback: any) => {
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

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
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
      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
      const request = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [{ text: 'Hello, World!' }] }],
      };

      const result = await generator.countTokens(request);

      expect(result.totalTokens).toBeDefined();
      expect(result.totalTokens).toBeGreaterThan(0);
    });

    it('should handle complex content', async () => {
      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
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
      mockEmbed.mockResolvedValueOnce({
        model: 'nomic-embed-text',
        embeddings: [[0.1, 0.2, 0.3, 0.4]],
      });

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
      const request = {
        model: 'nomic-embed-text',
        contents: ['Hello, World!'],
      };

      const result = await generator.embedContent(request);

      expect(result.embedding).toBeDefined();
      expect(result.embedding?.values).toEqual([0.1, 0.2, 0.3, 0.4]);
    });

    it('should handle array contents', async () => {
      mockEmbed.mockResolvedValueOnce({
        model: 'nomic-embed-text',
        embeddings: [[0.1, 0.2], [0.3, 0.4]],
      });

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
      const request = {
        model: 'nomic-embed-text',
        contents: [
          { role: 'user', parts: [{ text: 'Hello' }] },
          { role: 'user', parts: [{ text: 'World' }] },
        ],
      };

      await generator.embedContent(request);

      expect(mockEmbed).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.stringContaining('Hello'),
        })
      );
    });

    it('should handle embedding errors', async () => {
      mockEmbed.mockRejectedValueOnce(new Error('Model not found'));

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);

      await expect(
        generator.embedContent({ model: 'test', contents: ['Test'] })
      ).rejects.toThrow('Ollama embedding error');
    });
  });

  describe('useSummarizedThinking', () => {
    it('should return false (not supported in native Ollama)', () => {
      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);
      expect(generator.useSummarizedThinking()).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should apply context window size', async () => {
      mockChat.mockResolvedValueOnce({
        model: 'llama3.2',
        message: { role: 'assistant', content: 'Test' },
        done: true,
      });

      const generator = new OllamaNativeContentGenerator(
        createGeneratorConfig({ contextWindowSize: 4096 }),
        mockConfig
      );

      await generator.generateContent(
        { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
        'test-id'
      );

      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            num_ctx: 4096,
          }),
        })
      );
    });

    it('should apply repetition penalty', async () => {
      mockChat.mockResolvedValueOnce({
        model: 'llama3.2',
        message: { role: 'assistant', content: 'Test' },
        done: true,
      });

      const generator = new OllamaNativeContentGenerator(
        createGeneratorConfig({
          samplingParams: {
            repetition_penalty: 1.1,
            presence_penalty: 0.5,
            frequency_penalty: 0.3,
          },
        }),
        mockConfig
      );

      await generator.generateContent(
        { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
        'test-id'
      );

      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            repeat_penalty: 1.1,
            presence_penalty: 0.5,
            frequency_penalty: 0.3,
          }),
        })
      );
    });
  });

  describe('Error Recovery', () => {
    it('should provide meaningful error messages', async () => {
      mockChat.mockRejectedValueOnce(new Error('Model llama3.2 not found'));

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);

      await expect(
        generator.generateContent(
          { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
          'test-id'
        )
      ).rejects.toThrow('Model llama3.2 not found');
    });

    it('should handle network errors', async () => {
      mockChat.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const generator = new OllamaNativeContentGenerator(createGeneratorConfig(), mockConfig);

      await expect(
        generator.generateContent(
          { model: 'llama3.2', contents: [{ role: 'user', parts: [{ text: 'Test' }] }] },
          'test-id'
        )
      ).rejects.toThrow();
    });
  });
});
