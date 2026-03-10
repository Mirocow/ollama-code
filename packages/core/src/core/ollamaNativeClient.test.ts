/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  OllamaNativeClient,
  DEFAULT_OLLAMA_NATIVE_URL,
} from './ollamaNativeClient.js';
import {
  createMockOllamaServer,
  type MockServer,
} from '../test-utils/mockOllamaServer.js';

describe('OllamaNativeClient', () => {
  let mockServer: MockServer;
  let client: OllamaNativeClient;

  beforeEach(async () => {
    mockServer = await createMockOllamaServer({
      chunkDelay: 5, // Fast for tests
    });
    client = new OllamaNativeClient({
      baseUrl: mockServer.url,
      timeout: 5000,
    });
  });

  afterEach(async () => {
    await mockServer.close();
  });

  describe('chat', () => {
    it('should handle streaming chat responses', async () => {
      const chunks: Array<{ content: string; done: boolean }> = [];

      const response = await client.chat(
        {
          model: 'test-model',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        (chunk) => {
          chunks.push({
            content: chunk.message.content,
            done: chunk.done,
          });
        },
      );

      // Verify we got the final response
      expect(response.done).toBe(true);
      expect(response.message.role).toBe('assistant');
      expect(response.message.content).toContain('How can I help you today?');

      // Verify we got all chunks
      expect(chunks.length).toBeGreaterThan(1);

      // Verify last chunk is done
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.done).toBe(true);
    });

    it('should handle non-streaming chat responses', async () => {
      const response = await client.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      });

      expect(response.done).toBe(true);
      expect(response.message.role).toBe('assistant');
      expect(response.message.content).toBeTruthy();
    });

    it('should accumulate content correctly across chunks', async () => {
      let accumulatedContent = '';

      await client.chat(
        {
          model: 'test-model',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        (chunk) => {
          accumulatedContent += chunk.message.content;
        },
      );

      // Default mock response is "Hello! I am a mock AI assistant. How can I help you today?"
      expect(accumulatedContent).toContain('Hello!');
      expect(accumulatedContent).toContain('mock');
      expect(accumulatedContent).toContain('assistant');
    });
  });

  describe('listModels', () => {
    it('should list available models', async () => {
      const response = await client.listModels();

      expect(response.models).toBeDefined();
      expect(response.models.length).toBeGreaterThan(0);
      expect(response.models[0].name).toContain('mock-model');
    });
  });

  describe('showModel', () => {
    it('should show model information', async () => {
      const response = await client.showModel('mock-model');

      expect(response.modelfile).toBeDefined();
      expect(response.details).toBeDefined();
      expect(response.capabilities).toContain('completion');
      expect(response.capabilities).toContain('tools');
    });
  });

  describe('error handling', () => {
    it('should handle server errors', async () => {
      // Create new server that simulates errors
      const errorServer = await createMockOllamaServer({
        simulateError: true,
      });
      const errorClient = new OllamaNativeClient({
        baseUrl: errorServer.url,
        timeout: 1000,
        retry: { maxRetries: 0 }, // Disable retries for this test
      });

      try {
        await expect(
          errorClient.chat({
            model: 'test-model',
            messages: [{ role: 'user', content: 'Hello' }],
          }),
        ).rejects.toThrow();
      } finally {
        await errorServer.close();
      }
    });
  });

  describe('request tracking', () => {
    it('should track request count', async () => {
      expect(mockServer.getRequestCount()).toBe(0);

      await client.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      });

      expect(mockServer.getRequestCount()).toBe(1);

      await client.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello again' }],
        stream: false,
      });

      expect(mockServer.getRequestCount()).toBe(2);
    });

    it('should capture last request body', async () => {
      await client.chat({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test message' }],
        stream: false,
      });

      const lastRequest = mockServer.getLastRequest() as {
        model: string;
        messages: Array<{ role: string; content: string }>;
      };

      expect(lastRequest.model).toBe('test-model');
      expect(lastRequest.messages[0].content).toBe('Test message');
    });
  });

  describe('baseUrl handling', () => {
    it('should remove /v1 suffix from baseUrl', () => {
      const clientWithV1 = new OllamaNativeClient({
        baseUrl: 'http://localhost:11434/v1',
      });

      expect(clientWithV1.getBaseUrl()).toBe('http://localhost:11434');
    });

    it('should use default URL when not specified', () => {
      const defaultClient = new OllamaNativeClient();
      expect(defaultClient.getBaseUrl()).toBe(DEFAULT_OLLAMA_NATIVE_URL);
    });
  });
});
