/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';

// Import all re-exports to verify they're properly exported
import {
  // Ollama API types
  type OllamaModel,
  type OllamaModelDetails,
  type OllamaTagsResponse,
  type OllamaRunningModel,
  type OllamaPsResponse,
  type OllamaGenerateRequest,
  type OllamaGenerateResponse,
  type OllamaChatMessage,
  type OllamaToolCall,
  type OllamaTool,
  type OllamaChatRequest,
  type OllamaChatResponse,
  type OllamaModelOptions,
  type OllamaEmbedRequest,
  type OllamaEmbedResponse,
  type OllamaEmbeddingsRequest,
  type OllamaEmbeddingsResponse,
  type OllamaPullRequest,
  type OllamaPullResponse,
  type OllamaPushRequest,
  type OllamaPushResponse,
  type OllamaCopyRequest,
  type OllamaDeleteRequest,
  type OllamaShowRequest,
  type OllamaShowResponse,
  type OllamaVersionResponse,
  type OllamaProgressEvent,
  type StreamCallback,
  type ProgressCallback,
  DEFAULT_OLLAMA_NATIVE_URL,
  DEFAULT_OLLAMA_TIMEOUT,
  OllamaNativeClient,
  createOllamaNativeClient,
  // Content types
  type TextPart,
  type InlineDataPart,
  type FunctionCallPart,
  type FunctionResponsePart,
  type Part,
  type UserPart,
  type ModelPart,
  type FunctionCall,
  type FunctionResponse,
  type Schema,
  type FunctionDeclaration,
  type Tool,
  type Role,
  type Content,
  type UserContent,
  type ModelContent,
  type SystemContent,
  type ToolContent,
  type GenerateContentConfig,
  type GenerateContentParameters,
  type ToolCallingConfig,
  type SafetySetting,
  type UsageMetadata,
  type ContentCandidate,
  type Candidate,
  type SafetyRating,
  type CitationMetadata,
  type CitationSource,
  type Citation,
  type GenerateContentResponse,
  type GenerateContentResponseUsageMetadata,
  type CountTokensParameters,
  type CountTokensResponse,
  type EmbedContentParameters,
  type EmbedContentResponse,
  type PartListUnion,
  type PartUnion,
  type ContentUnion,
  type ContentListUnion,
  type CallableTool,
  FinishReason,
  Type,
  isTextPart,
  isFunctionCallPart,
  isFunctionResponsePart,
  isInlineDataPart,
  textContent,
  userContent,
  modelContent,
  systemContent,
  toolContent,
  normalizeParts,
  mcpToTool,
} from './index.js';

describe('types index re-exports', () => {
  describe('Ollama API types', () => {
    it('should export DEFAULT_OLLAMA_NATIVE_URL', () => {
      expect(DEFAULT_OLLAMA_NATIVE_URL).toBeDefined();
      expect(typeof DEFAULT_OLLAMA_NATIVE_URL).toBe('string');
    });

    it('should export DEFAULT_OLLAMA_TIMEOUT', () => {
      expect(DEFAULT_OLLAMA_TIMEOUT).toBeDefined();
      expect(typeof DEFAULT_OLLAMA_TIMEOUT).toBe('number');
    });

    it('should export OllamaNativeClient', () => {
      expect(OllamaNativeClient).toBeDefined();
    });

    it('should export createOllamaNativeClient', () => {
      expect(createOllamaNativeClient).toBeDefined();
      expect(typeof createOllamaNativeClient).toBe('function');
    });
  });

  describe('Content type exports', () => {
    it('should export FinishReason enum', () => {
      expect(FinishReason.STOP).toBe('STOP');
      expect(FinishReason.MAX_TOKENS).toBe('MAX_TOKENS');
    });

    it('should export Type constants', () => {
      expect(Type.STRING).toBe('string');
      expect(Type.NUMBER).toBe('number');
      expect(Type.OBJECT).toBe('object');
    });

    it('should export isTextPart function', () => {
      expect(typeof isTextPart).toBe('function');
      expect(isTextPart({ text: 'hello' })).toBe(true);
    });

    it('should export isFunctionCallPart function', () => {
      expect(typeof isFunctionCallPart).toBe('function');
      expect(isFunctionCallPart({ functionCall: { name: 'test', args: {} } })).toBe(true);
    });

    it('should export isFunctionResponsePart function', () => {
      expect(typeof isFunctionResponsePart).toBe('function');
      expect(isFunctionResponsePart({ functionResponse: { name: 'test', response: {} } })).toBe(true);
    });

    it('should export isInlineDataPart function', () => {
      expect(typeof isInlineDataPart).toBe('function');
      expect(isInlineDataPart({ inlineData: { mimeType: 'text/plain', data: 'test' } })).toBe(true);
    });

    it('should export textContent function', () => {
      expect(typeof textContent).toBe('function');
      const content = textContent('user', 'hello');
      expect(content.role).toBe('user');
    });

    it('should export userContent function', () => {
      expect(typeof userContent).toBe('function');
      const content = userContent('hello');
      expect(content.role).toBe('user');
    });

    it('should export modelContent function', () => {
      expect(typeof modelContent).toBe('function');
      const content = modelContent('response');
      expect(content.role).toBe('model');
    });

    it('should export systemContent function', () => {
      expect(typeof systemContent).toBe('function');
      const content = systemContent('instructions');
      expect(content.role).toBe('system');
    });

    it('should export toolContent function', () => {
      expect(typeof toolContent).toBe('function');
      const content = toolContent('func', { result: 'ok' });
      expect(content.role).toBe('tool');
    });

    it('should export normalizeParts function', () => {
      expect(typeof normalizeParts).toBe('function');
      expect(normalizeParts('hello')).toEqual([{ text: 'hello' }]);
    });

    it('should export mcpToTool function', () => {
      expect(typeof mcpToTool).toBe('function');
    });
  });

  describe('Type aliases', () => {
    it('should allow using OllamaModel type', () => {
      const model: OllamaModel = {
        name: 'llama3.2',
        modified_at: '2024-01-01',
        size: 4000000000,
        digest: 'abc123',
        details: {
          parent_model: '',
          format: 'gguf',
          family: 'llama',
          parameter_size: '3B',
          quantization_level: 'Q4_0',
        },
      };
      expect(model.name).toBe('llama3.2');
    });

    it('should allow using Part type', () => {
      const part: Part = { text: 'hello' };
      expect(part.text).toBe('hello');
    });

    it('should allow using Content type', () => {
      const content: Content = {
        role: 'user',
        parts: [{ text: 'hello' }],
      };
      expect(content.role).toBe('user');
    });

    it('should allow using FunctionCall type', () => {
      const fc: FunctionCall = { name: 'test', args: {} };
      expect(fc.name).toBe('test');
    });

    it('should allow using Tool type', () => {
      const tool: Tool = {
        functionDeclarations: [{ name: 'test', description: 'test' }],
      };
      expect(tool.functionDeclarations).toHaveLength(1);
    });
  });
});
