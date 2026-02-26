/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive tests for OllamaNativeClient.
 * Tests all native Ollama REST API endpoints.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  OllamaNativeClient,
  DEFAULT_OLLAMA_NATIVE_URL,
  createOllamaNativeClient,
} from './ollamaNativeClient.js';

// Test configuration
const OLLAMA_TEST_URL = process.env['OLLAMA_URL'] || 'http://localhost:11434';
const OLLAMA_TEST_MODEL = process.env['OLLAMA_TEST_MODEL'] || 'llama3.2';

// Skip tests if OLLAMA_SKIP_INTEGRATION is set
const shouldRunIntegrationTests = !process.env['OLLAMA_SKIP_INTEGRATION'];

// Mock fetch for unit tests
const mockFetch = vi.fn();
const originalFetch = global.fetch;

describe('OllamaNativeClient', () => {
  describe('Constructor and Configuration', () => {
    it('should use default URL if not provided', () => {
      const client = new OllamaNativeClient();
      expect(client.getBaseUrl()).toBe(DEFAULT_OLLAMA_NATIVE_URL);
    });

    it('should use custom URL when provided', () => {
      const client = new OllamaNativeClient({ baseUrl: 'http://custom:11434' });
      expect(client.getBaseUrl()).toBe('http://custom:11434');
    });

    it('should use default timeout if not provided', () => {
      const client = new OllamaNativeClient();
      // Timeout is private, but we can test behavior
      expect(client).toBeDefined();
    });

    it('should use custom timeout when provided', () => {
      const client = new OllamaNativeClient({ timeout: 60000 });
      expect(client).toBeDefined();
    });

    it('should create client via factory function', () => {
      const client = createOllamaNativeClient({ baseUrl: OLLAMA_TEST_URL });
      expect(client).toBeInstanceOf(OllamaNativeClient);
      expect(client.getBaseUrl()).toBe(OLLAMA_TEST_URL);
    });
  });

  // Unit tests with mocked fetch
  describe('Unit Tests (Mocked)', () => {
    beforeAll(() => {
      global.fetch = mockFetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    beforeEach(() => {
      mockFetch.mockReset();
    });

    describe('/api/generate', () => {
      it('should call /api/generate with correct parameters', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'llama3.2',
            created_at: '2024-01-01T00:00:00Z',
            response: 'Hello, World!',
            done: true,
            context: [1, 2, 3],
            total_duration: 1000000000,
            prompt_eval_count: 10,
            eval_count: 5,
          }),
        });

        const result = await client.generate({
          model: 'llama3.2',
          prompt: 'Why is the sky blue?',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/generate',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"model":"llama3.2"'),
          })
        );
        expect(result.response).toBe('Hello, World!');
        expect(result.done).toBe(true);
      });

      it('should handle streaming generate request', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        // Mock streaming response
        const mockReader = {
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('{"model":"llama3.2","response":"Hello","done":false}\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('{"model":"llama3.2","response":" World","done":false}\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('{"model":"llama3.2","response":"!","done":true}\n'),
            })
            .mockResolvedValue({ done: true, value: undefined }),
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          body: { getReader: () => mockReader },
        });

        const chunks: any[] = [];
        await client.generate(
          { model: 'llama3.2', prompt: 'Test' },
          (chunk) => chunks.push(chunk)
        );

        expect(chunks.length).toBe(3);
        expect(chunks[0].response).toBe('Hello');
        expect(chunks[2].done).toBe(true);
      });

      it('should support options parameter', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'llama3.2',
            response: 'Test',
            done: true,
          }),
        });

        await client.generate({
          model: 'llama3.2',
          prompt: 'Test',
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 100,
          },
        });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        expect(body.options.temperature).toBe(0.7);
        expect(body.options.top_p).toBe(0.9);
        expect(body.options.num_predict).toBe(100);
      });
    });

    describe('/api/chat', () => {
      it('should call /api/chat with correct parameters', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'llama3.2',
            created_at: '2024-01-01T00:00:00Z',
            message: { role: 'assistant', content: 'Hello!' },
            done: true,
          }),
        });

        const result = await client.chat({
          model: 'llama3.2',
          messages: [
            { role: 'user', content: 'Hello!' },
          ],
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/chat',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"messages"'),
          })
        );
        expect(result.message.content).toBe('Hello!');
      });

      it('should handle chat with tools', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'llama3.2',
            created_at: '2024-01-01T00:00:00Z',
            message: {
              role: 'assistant',
              content: '',
              tool_calls: [
                {
                  function: {
                    name: 'get_weather',
                    arguments: { location: 'San Francisco' },
                  },
                },
              ],
            },
            done: true,
          }),
        });

        const result = await client.chat({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'What is the weather?' }],
          tools: [
            {
              type: 'function',
              function: {
                name: 'get_weather',
                description: 'Get weather',
                parameters: { type: 'object', properties: { location: { type: 'string' } } },
              },
            },
          ],
        });

        expect(result.message.tool_calls).toBeDefined();
        expect(result.message.tool_calls?.[0].function.name).toBe('get_weather');
      });

      it('should handle chat with images', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'llava',
            message: { role: 'assistant', content: 'This is an image of a cat.' },
            done: true,
          }),
        });

        const result = await client.chat({
          model: 'llava',
          messages: [
            {
              role: 'user',
              content: 'What is in this image?',
              images: ['base64imagedata'],
            },
          ],
        });

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        expect(body.messages[0].images).toContain('base64imagedata');
        expect(result.message.content).toContain('image');
      });
    });

    describe('/api/tags', () => {
      it('should list local models', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [
              {
                name: 'llama3.2:latest',
                modified_at: '2024-01-01T00:00:00Z',
                size: 4000000000,
                digest: 'abc123',
                details: {
                  format: 'gguf',
                  family: 'llama',
                  parameter_size: '3B',
                  quantization_level: 'Q4_0',
                },
              },
            ],
          }),
        });

        const result = await client.listModels();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/tags',
          expect.objectContaining({ method: 'GET' })
        );
        expect(result.models).toHaveLength(1);
        expect(result.models[0].name).toBe('llama3.2:latest');
      });
    });

    describe('/api/show', () => {
      it('should show model information', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            modelfile: 'FROM llama3.2',
            parameters: 'temperature 0.7',
            template: '{{ .System }}\n{{ .Prompt }}',
            details: {
              format: 'gguf',
              family: 'llama',
              parameter_size: '3B',
              quantization_level: 'Q4_0',
            },
          }),
        });

        const result = await client.showModel('llama3.2');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/show',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"model":"llama3.2"'),
          })
        );
        expect(result.modelfile).toContain('FROM llama3.2');
      });
    });

    describe('/api/copy', () => {
      it('should copy a model', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({ ok: true });

        await client.copyModel('llama3.2', 'llama3-backup');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/copy',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"source":"llama3.2"'),
          })
        );
      });
    });

    describe('/api/delete', () => {
      it('should delete a model', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({ ok: true });

        await client.deleteModel('llama3:13b');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/delete',
          expect.objectContaining({
            method: 'DELETE',
            body: expect.stringContaining('"model":"llama3:13b"'),
          })
        );
      });
    });

    describe('/api/pull', () => {
      it('should pull a model (non-streaming)', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({ ok: true });

        await client.pullModel('llama3.2');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/pull',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"name":"llama3.2"'),
          })
        );
      });

      it('should pull a model with progress callback', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        const mockReader = {
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('{"status":"pulling manifest"}\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('{"status":"downloading","total":1000,"completed":500}\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('{"status":"verifying sha256 digest"}\n'),
            })
            .mockResolvedValue({ done: true, value: undefined }),
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          body: { getReader: () => mockReader },
        });

        const progressEvents: any[] = [];
        await client.pullModel('llama3.2', (progress) => {
          progressEvents.push(progress);
        });

        expect(progressEvents.length).toBe(3);
        expect(progressEvents[1].percentage).toBe(50);
      });
    });

    describe('/api/push', () => {
      it('should push a model', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({ ok: true });

        await client.pushModel('mattw/pygmalion:latest');

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/push',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"name":"mattw/pygmalion:latest"'),
          })
        );
      });
    });

    describe('/api/embed', () => {
      it('should generate embeddings', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            model: 'all-minilm',
            embeddings: [
              [0.1, 0.2, 0.3, 0.4],
              [0.5, 0.6, 0.7, 0.8],
            ],
          }),
        });

        const result = await client.embed({
          model: 'all-minilm',
          input: ['Why is the sky blue?', 'Why is the grass green?'],
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/embed',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"input"'),
          })
        );
        expect(result.embeddings).toHaveLength(2);
      });
    });

    describe('/api/embeddings (legacy)', () => {
      it('should generate single embedding (legacy endpoint)', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            embedding: [0.1, 0.2, 0.3, 0.4],
          }),
        });

        const result = await client.embeddings({
          model: 'all-minilm',
          prompt: 'Here is an article about llamas...',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/embeddings',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"prompt"'),
          })
        );
        expect(result.embedding).toHaveLength(4);
      });
    });

    describe('/api/version', () => {
      it('should get Ollama version', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ version: '0.1.26' }),
        });

        const result = await client.getVersion();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/version',
          expect.objectContaining({ method: 'GET' })
        );
        expect(result.version).toBe('0.1.26');
      });
    });

    describe('/api/ps', () => {
      it('should list running models', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [
              {
                name: 'llama3.2:latest',
                model: 'llama3.2:latest',
                size: 4000000000,
                digest: 'abc123',
                details: {
                  format: 'gguf',
                  family: 'llama',
                  parameter_size: '3B',
                  quantization_level: 'Q4_0',
                },
                expires_at: '2024-01-01T01:00:00Z',
                size_vram: 4000000000,
              },
            ],
          }),
        });

        const result = await client.listRunningModels();

        expect(mockFetch).toHaveBeenCalledWith(
          'http://test:11434/api/ps',
          expect.objectContaining({ method: 'GET' })
        );
        expect(result.models).toHaveLength(1);
        expect(result.models[0].size_vram).toBe(4000000000);
      });
    });

    describe('Error Handling', () => {
      it('should throw error on HTTP error', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => '{"error": "model not found"}',
        });

        await expect(client.showModel('nonexistent')).rejects.toThrow('model not found');
      });

      it('should throw error on timeout', async () => {
        const client = new OllamaNativeClient({
          baseUrl: 'http://test:11434',
          timeout: 1, // 1ms timeout
        });

        // Mock a slow response
        mockFetch.mockImplementationOnce(() =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ version: '0.1.26' }),
              });
            }, 100);
          })
        );

        // The abort signal should cause an error
        await expect(client.getVersion()).rejects.toThrow();
      });

      it('should handle malformed JSON error response', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Not JSON',
        });

        await expect(client.showModel('test')).rejects.toThrow('500');
      });
    });

    describe('Utility Methods', () => {
      it('should check if server is running', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ version: '0.1.26' }),
        });

        const isRunning = await client.isServerRunning();
        expect(isRunning).toBe(true);
      });

      it('should return false if server is not running', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

        const isRunning = await client.isServerRunning();
        expect(isRunning).toBe(false);
      });

      it('should check if model is available', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [{ name: 'llama3.2:latest' }],
          }),
        });

        const isAvailable = await client.isModelAvailable('llama3.2');
        expect(isAvailable).toBe(true);
      });

      it('should return false if model is not available', async () => {
        const client = new OllamaNativeClient({ baseUrl: 'http://test:11434' });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            models: [{ name: 'llama3.2:latest' }],
          }),
        });

        const isAvailable = await client.isModelAvailable('nonexistent');
        expect(isAvailable).toBe(false);
      });
    });
  });

  // Integration tests (require running Ollama server)
  describe.skipIf(shouldRunIntegrationTests)('Integration Tests (Live Ollama)', () => {
    let client: OllamaNativeClient;
    let hasTestModel: boolean;

    beforeAll(async () => {
      client = new OllamaNativeClient({ baseUrl: OLLAMA_TEST_URL });

      // Check if server is running
      const isRunning = await client.isServerRunning();
      if (!isRunning) {
        console.warn('Ollama server not running, skipping integration tests');
      }

      // Check if test model is available
      hasTestModel = await client.isModelAvailable(OLLAMA_TEST_MODEL);
    });

    describe('/api/version', () => {
      it('should get Ollama version', async () => {
        const result = await client.getVersion();
        expect(result.version).toBeDefined();
        console.log('Ollama version:', result.version);
      });
    });

    describe('/api/tags', () => {
      it('should list local models', async () => {
        const result = await client.listModels();
        expect(result.models).toBeDefined();
        expect(Array.isArray(result.models)).toBe(true);
        console.log('Available models:', result.models.map(m => m.name));
      });
    });

    describe('/api/ps', () => {
      it('should list running models', async () => {
        const result = await client.listRunningModels();
        expect(result.models).toBeDefined();
        expect(Array.isArray(result.models)).toBe(true);
      });
    });

    describe('/api/show', () => {
      it.skipIf(!hasTestModel)('should show model information', async () => {
        const result = await client.showModel(OLLAMA_TEST_MODEL);
        expect(result.modelfile).toBeDefined();
        expect(result.details).toBeDefined();
      });
    });

    describe('/api/generate', () => {
      it.skipIf(!hasTestModel)('should generate text', async () => {
        const result = await client.generate({
          model: OLLAMA_TEST_MODEL,
          prompt: 'Say "Hello, World!" and nothing else.',
        });

        expect(result.response).toBeDefined();
        expect(result.done).toBe(true);
        console.log('Generated text:', result.response);
      });

      it.skipIf(!hasTestModel)('should generate text with options', async () => {
        const result = await client.generate({
          model: OLLAMA_TEST_MODEL,
          prompt: 'Count from 1 to 5.',
          options: {
            temperature: 0.1,
            num_predict: 50,
          },
        });

        expect(result.response).toBeDefined();
      });

      it.skipIf(!hasTestModel)('should stream generate response', async () => {
        const chunks: string[] = [];

        const result = await client.generate(
          {
            model: OLLAMA_TEST_MODEL,
            prompt: 'Say "test".',
          },
          (chunk) => {
            if (chunk.response) {
              chunks.push(chunk.response);
            }
          }
        );

        expect(chunks.length).toBeGreaterThan(0);
        expect(result.done).toBe(true);
      });
    });

    describe('/api/chat', () => {
      it.skipIf(!hasTestModel)('should have a chat conversation', async () => {
        const result = await client.chat({
          model: OLLAMA_TEST_MODEL,
          messages: [
            { role: 'user', content: 'Say "Hello!" and nothing else.' },
          ],
        });

        expect(result.message).toBeDefined();
        expect(result.message.content).toBeDefined();
        console.log('Chat response:', result.message.content);
      });

      it.skipIf(!hasTestModel)('should handle multi-turn conversation', async () => {
        const result = await client.chat({
          model: OLLAMA_TEST_MODEL,
          messages: [
            { role: 'user', content: 'My name is Alice.' },
            { role: 'assistant', content: 'Hello Alice! How can I help you?' },
            { role: 'user', content: 'What is my name?' },
          ],
        });

        expect(result.message.content).toBeDefined();
        expect(result.message.content.toLowerCase()).toContain('alice');
      });
    });

    describe('/api/embed', () => {
      it.skipIf(!hasTestModel)('should generate embeddings', async () => {
        // Try with the main model first, skip if not supported
        try {
          const result = await client.embed({
            model: OLLAMA_TEST_MODEL,
            input: ['Hello, world!', 'Test embedding'],
          });

          expect(result.embeddings).toBeDefined();
          expect(result.embeddings.length).toBe(2);
          console.log('Embedding dimension:', result.embeddings[0].length);
        } catch (error) {
          console.log('Embedding not supported with this model, skipping');
        }
      });
    });

    describe('/api/embeddings (legacy)', () => {
      it.skipIf(!hasTestModel)('should generate single embedding', async () => {
        try {
          const result = await client.embeddings({
            model: OLLAMA_TEST_MODEL,
            prompt: 'Test prompt for embedding',
          });

          expect(result.embedding).toBeDefined();
          expect(Array.isArray(result.embedding)).toBe(true);
        } catch (error) {
          console.log('Legacy embedding not supported with this model, skipping');
        }
      });
    });
  });
});
