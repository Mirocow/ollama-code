/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for OllamaContentConverter.
 * Tests conversion between GenAI and native Ollama formats.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OllamaContentConverter } from './converter.js';
import { FinishReason, Type } from '@google/genai';
import type { OllamaChatResponse } from '../ollamaNativeClient.js';

describe('OllamaContentConverter', () => {
  let converter: OllamaContentConverter;

  beforeEach(() => {
    converter = new OllamaContentConverter('llama3.2');
  });

  describe('setModel', () => {
    it('should update the model', () => {
      converter.setModel('llava');
      expect(converter).toBeDefined();
    });
  });

  describe('convertGenAIRequestToOllama', () => {
    it('should convert basic text request', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello, World!' }],
          },
        ],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.model).toBe('llama3.2');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe('Hello, World!');
    });

    it('should convert multi-turn conversation', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [
          { role: 'user', parts: [{ text: 'Hi!' }] },
          { role: 'model', parts: [{ text: 'Hello!' }] },
          { role: 'user', parts: [{ text: 'How are you?' }] },
        ],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[1].role).toBe('assistant');
      expect(result.messages[2].role).toBe('user');
    });

    it('should convert system instruction', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        config: {
          systemInstruction: 'You are a helpful assistant.',
        },
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[0].content).toBe('You are a helpful assistant.');
    });

    it('should convert system instruction from Content object', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        config: {
          systemInstruction: {
            role: 'system',
            parts: [{ text: 'Be concise.' }, { text: 'Be accurate.' }],
          },
        },
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.messages[0].role).toBe('system');
      expect(result.messages[0].content).toBe('Be concise.\nBe accurate.');
    });

    it('should convert generation config options', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
        config: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 100,
          stopSequences: ['END'],
        },
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.options?.temperature).toBe(0.7);
      expect(result.options?.top_p).toBe(0.9);
      expect(result.options?.top_k).toBe(40);
      expect(result.options?.num_predict).toBe(100);
      expect(result.options?.stop).toContain('END');
    });

    it('should convert inline images', () => {
      const genaiRequest = {
        model: 'llava',
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'What is in this image?' },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'base64imagedata',
                },
              },
            ],
          },
        ],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.messages[0].images).toBeDefined();
      expect(result.messages[0].images).toContain('base64imagedata');
    });

    it('should convert function calls in assistant messages', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [
          { role: 'user', parts: [{ text: 'What is the weather?' }] },
          {
            role: 'model',
            parts: [
              {
                functionCall: {
                  id: 'call_123',
                  name: 'get_weather',
                  args: { location: 'San Francisco' },
                },
              },
            ],
          },
        ],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.messages[1].tool_calls).toBeDefined();
      expect(result.messages[1].tool_calls?.[0].function.name).toBe('get_weather');
      expect(result.messages[1].tool_calls?.[0].function.arguments).toEqual({
        location: 'San Francisco',
      });
    });

    it('should convert function responses in user messages', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [
          { role: 'user', parts: [{ text: 'What is the weather?' }] },
          {
            role: 'model',
            parts: [
              {
                functionCall: {
                  id: 'call_123',
                  name: 'get_weather',
                  args: { location: 'San Francisco' },
                },
              },
            ],
          },
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  id: 'call_123',
                  name: 'get_weather',
                  response: { temperature: 72, condition: 'sunny' },
                },
              },
            ],
          },
        ],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      // Function response should be converted to tool message
      expect(result.messages).toHaveLength(3);
    });

    it('should convert string contents', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: ['Hello, World!'],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content).toBe('Hello, World!');
    });

    it('should filter out thought parts', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [
          {
            role: 'assistant',
            parts: [
              { text: 'Thinking...', thought: true },
              { text: 'Hello!' },
            ],
          },
        ],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.messages[0].content).toBe('Hello!');
    });
  });

  describe('convertGenAIToolsToOllama', () => {
    it('should convert tools', () => {
      const genaiTools = [
        {
          functionDeclarations: [
            {
              name: 'get_weather',
              description: 'Get the current weather',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  location: { type: Type.STRING },
                },
                required: ['location'],
              },
            },
          ],
        },
      ] as any;

      const result = converter.convertGenAIToolsToOllama(genaiTools);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('function');
      expect(result[0].function.name).toBe('get_weather');
      expect(result[0].function.description).toBe('Get the current weather');
      expect(result[0].function.parameters).toBeDefined();
    });

    it('should convert tools with parametersJsonSchema', () => {
      const genaiTools = [
        {
          functionDeclarations: [
            {
              name: 'calculate',
              description: 'Perform a calculation',
              parametersJsonSchema: {
                type: 'object',
                properties: {
                  expression: { type: 'string' },
                },
              },
            },
          ],
        },
      ];

      const result = converter.convertGenAIToolsToOllama(genaiTools as any);

      expect(result).toHaveLength(1);
      expect(result[0].function.parameters).toEqual({
        type: 'object',
        properties: {
          expression: { type: 'string' },
        },
      });
    });

    it('should return empty array for undefined tools', () => {
      const result = converter.convertGenAIToolsToOllama(undefined);
      expect(result).toEqual([]);
    });

    it('should skip tools without name or description', () => {
      const genaiTools = [
        {
          functionDeclarations: [
            { name: 'valid_tool', description: 'A valid tool' },
            { name: 'no_description' }, // Missing description
            { description: 'no_name' }, // Missing name
          ],
        },
      ];

      const result = converter.convertGenAIToolsToOllama(genaiTools as any);
      expect(result).toHaveLength(1);
    });
  });

  describe('convertOllamaResponseToGenAI', () => {
    it('should convert basic text response', () => {
      const ollamaResponse: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello, World!',
        },
        done: true,
        prompt_eval_count: 10,
        eval_count: 5,
      };

      const result = converter.convertOllamaResponseToGenAI(ollamaResponse);

      expect(result.candidates).toBeDefined();
      const candidate = result.candidates?.[0];
      expect(candidate).toBeDefined();
      expect(candidate?.content?.parts).toHaveLength(1);
      expect((candidate?.content?.parts as any)?.[0]).toHaveProperty('text', 'Hello, World!');
      expect(candidate?.finishReason).toBe(FinishReason.STOP);
    });

    it('should convert response with tool calls', () => {
      const ollamaResponse: OllamaChatResponse = {
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
      };

      const result = converter.convertOllamaResponseToGenAI(ollamaResponse);
      const candidate = result.candidates?.[0];

      expect(candidate?.content?.parts).toHaveLength(1);
      expect((candidate?.content?.parts as any)?.[0]).toHaveProperty('functionCall');
      const functionCall = ((candidate?.content?.parts as any)?.[0]).functionCall;
      expect(functionCall.name).toBe('get_weather');
      expect(functionCall.args).toEqual({ location: 'San Francisco' });
    });

    it('should convert response with text and tool calls', () => {
      const ollamaResponse: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Let me check the weather.',
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
      };

      const result = converter.convertOllamaResponseToGenAI(ollamaResponse);
      const candidate = result.candidates?.[0];

      expect(candidate?.content?.parts).toHaveLength(2);
      expect((candidate?.content?.parts as any)?.[0]).toHaveProperty('text');
      expect((candidate?.content?.parts as any)?.[1]).toHaveProperty('functionCall');
    });

    it('should include usage metadata', () => {
      const ollamaResponse: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello!',
        },
        done: true,
        prompt_eval_count: 100,
        eval_count: 50,
        total_duration: 1000000000,
      };

      const result = converter.convertOllamaResponseToGenAI(ollamaResponse);

      expect(result.usageMetadata).toBeDefined();
      expect(result.usageMetadata?.promptTokenCount).toBe(100);
      expect(result.usageMetadata?.candidatesTokenCount).toBe(50);
      expect(result.usageMetadata?.totalTokenCount).toBe(150);
    });

    it('should set finish reason based on done flag', () => {
      const ollamaResponseDone: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'Done' },
        done: true,
      };

      const ollamaResponseNotDone: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'Processing...' },
        done: false,
      };

      const resultDone = converter.convertOllamaResponseToGenAI(ollamaResponseDone);
      const resultNotDone = converter.convertOllamaResponseToGenAI(ollamaResponseNotDone);

      expect(resultDone.candidates?.[0]?.finishReason).toBe(FinishReason.STOP);
      expect(resultNotDone.candidates?.[0]?.finishReason).toBe(FinishReason.FINISH_REASON_UNSPECIFIED);
    });

    it('should set model version', () => {
      const ollamaResponse: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: { role: 'assistant', content: 'Hello' },
        done: true,
      };

      const result = converter.convertOllamaResponseToGenAI(ollamaResponse);

      expect(result.modelVersion).toBe('llama3.2');
    });
  });

  describe('convertOllamaChunkToGenAI', () => {
    it('should convert streaming chunk', () => {
      const ollamaChunk: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'Hello',
        },
        done: false,
      };

      const result = converter.convertOllamaChunkToGenAI(ollamaChunk);
      const candidate = result.candidates?.[0];

      expect(candidate?.content?.parts).toHaveLength(1);
      expect((candidate?.content?.parts as any)?.[0]).toHaveProperty('text', 'Hello');
    });

    it('should convert final streaming chunk', () => {
      const ollamaChunk: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: 'World!',
        },
        done: true,
        eval_count: 10,
      };

      const result = converter.convertOllamaChunkToGenAI(ollamaChunk);

      expect(result.candidates?.[0]?.finishReason).toBe(FinishReason.STOP);
    });

    it('should handle tool calls in streaming', () => {
      const toolCallAccumulator = new Map<number, { name: string; args: string }>();

      const ollamaChunk: OllamaChatResponse = {
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
      };

      const result = converter.convertOllamaChunkToGenAI(ollamaChunk, toolCallAccumulator);
      const candidate = result.candidates?.[0];

      expect(candidate?.content?.parts).toHaveLength(1);
      expect((candidate?.content?.parts as any)?.[0]).toHaveProperty('functionCall');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty parts array', () => {
      const genaiRequest = {
        model: 'llama3.2',
        contents: [{ role: 'user', parts: [] }],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      // Empty parts should not create a message
      expect(result.messages).toHaveLength(0);
    });

    it('should handle null content in message', () => {
      const ollamaResponse: OllamaChatResponse = {
        model: 'llama3.2',
        created_at: '2024-01-01T00:00:00Z',
        message: {
          role: 'assistant',
          content: '',
        },
        done: true,
      };

      const result = converter.convertOllamaResponseToGenAI(ollamaResponse);

      // Should handle empty content gracefully
      expect(result.candidates?.[0]?.content?.parts).toHaveLength(0);
    });

    it('should handle mixed content types', () => {
      const genaiRequest = {
        model: 'llava',
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Text part' },
              { inlineData: { mimeType: 'image/png', data: 'img' } },
            ],
          },
        ],
      };

      const result = converter.convertGenAIRequestToOllama(genaiRequest);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toContain('Text part');
      expect(result.messages[0].images).toContain('img');
    });
  });
});
