/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  contentsToOllamaMessages,
  ollamaResponseToGenerateContentResponse,
  toolsToOllamaTools,
  functionDeclarationToOllamaTool,
  StreamingResponseAggregator,
  generateParamsToOllamaRequest,
  extractTextFromParts,
  extractTextFromContents,
  hasFunctionCalls,
  getFunctionCalls,
} from './ollamaConverter.js';
import type {
  Content,
  Part,
  Tool,
  FunctionDeclaration,
  OllamaChatResponse,
  OllamaToolCall,
} from '../types/index.js';

describe('ollamaConverter', () => {
  describe('contentsToOllamaMessages', () => {
    it('should convert user content', () => {
      const contents: Content[] = [
        { role: 'user', parts: [{ text: 'Hello' }] },
      ];

      const messages = contentsToOllamaMessages(contents);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: 'user',
        content: 'Hello',
      });
    });

    it('should convert model/assistant content', () => {
      const contents: Content[] = [
        { role: 'model', parts: [{ text: 'Hi there!' }] },
      ];

      const messages = contentsToOllamaMessages(contents);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: 'assistant',
        content: 'Hi there!',
      });
    });

    it('should convert system content', () => {
      const contents: Content[] = [
        { role: 'system', parts: [{ text: 'You are helpful.' }] },
      ];

      const messages = contentsToOllamaMessages(contents);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: 'system',
        content: 'You are helpful.',
      });
    });

    it('should convert tool response content', () => {
      const contents: Content[] = [
        {
          role: 'tool',
          parts: [
            {
              functionResponse: {
                name: 'getWeather',
                response: { temperature: 72 },
              },
            },
          ],
        },
      ];

      const messages = contentsToOllamaMessages(contents);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: 'tool',
        content: '{"temperature":72}',
      });
    });

    it('should convert model content with tool calls', () => {
      const contents: Content[] = [
        {
          role: 'model',
          parts: [
            { text: 'Let me check that.' },
            {
              functionCall: {
                name: 'getWeather',
                args: { location: 'NYC' },
              },
            },
          ],
        },
      ];

      const messages = contentsToOllamaMessages(contents);

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('assistant');
      expect(messages[0].content).toBe('Let me check that.');
      expect(messages[0].tool_calls).toHaveLength(1);
      expect(messages[0].tool_calls?.[0]).toEqual({
        function: {
          name: 'getWeather',
          arguments: { location: 'NYC' },
        },
      });
    });

    it('should convert content with images', () => {
      const contents: Content[] = [
        {
          role: 'user',
          parts: [
            { text: 'What is this?' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: 'base64imagedata',
              },
            },
          ],
        },
      ];

      const messages = contentsToOllamaMessages(contents);

      expect(messages).toHaveLength(1);
      expect(messages[0].images).toEqual(['base64imagedata']);
    });

    it('should handle multiple text parts', () => {
      const contents: Content[] = [
        {
          role: 'user',
          parts: [{ text: 'Hello' }, { text: 'World' }],
        },
      ];

      const messages = contentsToOllamaMessages(contents);

      expect(messages[0].content).toBe('Hello\nWorld');
    });
  });

  describe('ollamaResponseToGenerateContentResponse', () => {
    it('should convert text response', () => {
      const response: OllamaChatResponse = {
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello!',
        },
        done: true,
      };

      const result = ollamaResponseToGenerateContentResponse(response);

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].content.role).toBe('model');
      expect(result.candidates[0].content.parts).toEqual([{ text: 'Hello!' }]);
      expect(result.candidates[0].finishReason).toBe('STOP');
    });

    it('should convert response with tool calls', () => {
      const response: OllamaChatResponse = {
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              function: {
                name: 'getWeather',
                arguments: { location: 'NYC' },
              },
            },
          ],
        },
        done: true,
      };

      const result = ollamaResponseToGenerateContentResponse(response);

      expect(result.candidates[0].finishReason).toBe('TOOL_CALLS');
      expect(result.candidates[0].content.parts).toContainEqual({
        functionCall: {
          name: 'getWeather',
          args: { location: 'NYC' },
        },
      });
    });

    it('should handle incomplete response', () => {
      const response: OllamaChatResponse = {
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Partial...',
        },
        done: false,
      };

      const result = ollamaResponseToGenerateContentResponse(response);

      expect(result.candidates[0].finishReason).toBe('OTHER');
    });

    it('should include usage metadata', () => {
      const response: OllamaChatResponse = {
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello!',
        },
        done: true,
        prompt_eval_count: 10,
        eval_count: 5,
      };

      const result = ollamaResponseToGenerateContentResponse(response);

      expect(result.usageMetadata?.promptTokenCount).toBe(10);
      expect(result.usageMetadata?.candidatesTokenCount).toBe(5);
      expect(result.usageMetadata?.totalTokenCount).toBe(15);
    });
  });

  describe('toolsToOllamaTools', () => {
    it('should convert tools to ollama format', () => {
      const tools: Tool[] = [
        {
          functionDeclarations: [
            {
              name: 'getWeather',
              description: 'Get weather info',
              parameters: {
                type: 'object',
                properties: {
                  location: { type: 'string' },
                },
              },
            },
          ],
        },
      ];

      const result = toolsToOllamaTools(tools);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('function');
      expect(result[0].function.name).toBe('getWeather');
    });

    it('should handle multiple tools', () => {
      const tools: Tool[] = [
        {
          functionDeclarations: [
            { name: 'tool1', description: 'Tool 1' },
            { name: 'tool2', description: 'Tool 2' },
          ],
        },
      ];

      const result = toolsToOllamaTools(tools);

      expect(result).toHaveLength(2);
    });

    it('should return empty array for empty tools', () => {
      expect(toolsToOllamaTools([])).toEqual([]);
      expect(toolsToOllamaTools([{}])).toEqual([]);
    });
  });

  describe('functionDeclarationToOllamaTool', () => {
    it('should convert function declaration', () => {
      const func: FunctionDeclaration = {
        name: 'search',
        description: 'Search for items',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
      };

      const result = functionDeclarationToOllamaTool(func);

      expect(result.type).toBe('function');
      expect(result.function.name).toBe('search');
      expect(result.function.description).toBe('Search for items');
      expect(result.function.parameters).toBeDefined();
    });

    it('should handle function without parameters', () => {
      const func: FunctionDeclaration = {
        name: 'ping',
        description: 'Ping the server',
      };

      const result = functionDeclarationToOllamaTool(func);

      expect(result.function.parameters).toEqual({});
    });
  });

  describe('StreamingResponseAggregator', () => {
    it('should aggregate text content', () => {
      const aggregator = new StreamingResponseAggregator();

      aggregator.addChunk({
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'Hello' },
        done: false,
      });

      aggregator.addChunk({
        model: 'llama2',
        created_at: '2024-01-01T00:00:01Z',
        message: { role: 'assistant', content: ' World' },
        done: true,
      });

      const response = aggregator.buildResponse();

      expect(response.message.content).toBe('Hello World');
      expect(response.done).toBe(true);
    });

    it('should aggregate tool calls', () => {
      const aggregator = new StreamingResponseAggregator();

      aggregator.addChunk({
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            { function: { name: 'tool1', arguments: {} } },
          ],
        },
        done: false,
      });

      aggregator.addChunk({
        model: 'llama2',
        created_at: '2024-01-01T00:00:01Z',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            { function: { name: 'tool2', arguments: {} } },
          ],
        },
        done: true,
      });

      const response = aggregator.buildResponse();

      expect(response.message.tool_calls).toHaveLength(2);
    });

    it('should aggregate usage metadata', () => {
      const aggregator = new StreamingResponseAggregator();

      aggregator.addChunk({
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'test' },
        done: false,
        prompt_eval_count: 10,
        eval_count: 5,
      });

      aggregator.addChunk({
        model: 'llama2',
        created_at: '2024-01-01T00:00:01Z',
        message: { role: 'assistant', content: '' },
        done: true,
        eval_count: 3,
      });

      const response = aggregator.buildResponse();

      expect(response.prompt_eval_count).toBe(10);
      expect(response.eval_count).toBe(8); // Accumulated
    });

    it('should build GenerateContentResponse', () => {
      const aggregator = new StreamingResponseAggregator();

      aggregator.addChunk({
        model: 'llama2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'Hello' },
        done: true,
      });

      const response = aggregator.buildGenerateContentResponse();

      expect(response.candidates).toHaveLength(1);
      expect(response.candidates[0].content.parts).toEqual([{ text: 'Hello' }]);
    });
  });

  describe('generateParamsToOllamaRequest', () => {
    it('should convert basic parameters', () => {
      const params = {
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      };

      const request = generateParamsToOllamaRequest(params as any, 'llama2');

      expect(request.model).toBe('llama2');
      expect(request.messages).toHaveLength(1);
      expect(request.stream).toBe(false);
    });

    it('should add system instruction', () => {
      const params = {
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        systemInstruction: 'You are helpful.',
      };

      const request = generateParamsToOllamaRequest(params as any, 'llama2');

      expect(request.messages[0]).toEqual({
        role: 'system',
        content: 'You are helpful.',
      });
    });

    it('should add system instruction from Content', () => {
      const params = {
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        systemInstruction: {
          parts: [{ text: 'Be helpful.' }, { text: 'Be concise.' }],
        },
      };

      const request = generateParamsToOllamaRequest(params as any, 'llama2');

      expect(request.messages[0].role).toBe('system');
      expect(request.messages[0].content).toBe('Be helpful.\nBe concise.');
    });

    it('should add tools', () => {
      const params = {
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        tools: [
          {
            functionDeclarations: [
              { name: 'test', description: 'Test tool' },
            ],
          },
        ],
      };

      const request = generateParamsToOllamaRequest(params as any, 'llama2');

      expect(request.tools).toHaveLength(1);
    });

    it('should add generation config options', () => {
      const params = {
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 100,
        },
      };

      const request = generateParamsToOllamaRequest(params as any, 'llama2');

      expect(request.options?.temperature).toBe(0.7);
      expect(request.options?.top_p).toBe(0.9);
      expect(request.options?.num_predict).toBe(100);
    });
  });

  describe('extractTextFromParts', () => {
    it('should extract text from parts', () => {
      const parts: Part[] = [
        { text: 'Hello' },
        { functionCall: { name: 'test', args: {} } },
        { text: 'World' },
      ];

      expect(extractTextFromParts(parts)).toBe('Hello\nWorld');
    });

    it('should return empty string for no text parts', () => {
      const parts: Part[] = [
        { functionCall: { name: 'test', args: {} } },
      ];

      expect(extractTextFromParts(parts)).toBe('');
    });
  });

  describe('extractTextFromContents', () => {
    it('should extract text from contents', () => {
      const contents: Content[] = [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi' }] },
      ];

      expect(extractTextFromContents(contents)).toBe('Hello\nHi');
    });
  });

  describe('hasFunctionCalls', () => {
    it('should return true for content with function calls', () => {
      const content: Content = {
        role: 'model',
        parts: [{ functionCall: { name: 'test', args: {} } }],
      };

      expect(hasFunctionCalls(content)).toBe(true);
    });

    it('should return false for content without function calls', () => {
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Hello' }],
      };

      expect(hasFunctionCalls(content)).toBe(false);
    });
  });

  describe('getFunctionCalls', () => {
    it('should return all function calls from content', () => {
      const content: Content = {
        role: 'model',
        parts: [
          { functionCall: { name: 'func1', args: { a: 1 } } },
          { functionCall: { name: 'func2', args: { b: 2 } } },
        ],
      };

      const calls = getFunctionCalls(content);

      expect(calls).toHaveLength(2);
      expect(calls[0].name).toBe('func1');
      expect(calls[1].name).toBe('func2');
    });

    it('should return empty array for content without function calls', () => {
      const content: Content = {
        role: 'model',
        parts: [{ text: 'Hello' }],
      };

      expect(getFunctionCalls(content)).toEqual([]);
    });
  });
});
