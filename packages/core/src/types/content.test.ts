/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
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
  createUserContent,
  createModelContent,
  GenerateContentResponse,
  type Part,
  type TextPart,
  type InlineDataPart,
  type FunctionCallPart,
  type FunctionResponsePart,
  type FunctionCall,
  type FunctionResponse,
  type Content,
  type UserContent,
  type ModelContent,
  type SystemContent,
  type ToolContent,
  type Schema,
  type FunctionDeclaration,
  type Tool,
} from './content.js';

describe('FinishReason', () => {
  it('should have STOP value', () => {
    expect(FinishReason.STOP).toBe('STOP');
  });

  it('should have MAX_TOKENS value', () => {
    expect(FinishReason.MAX_TOKENS).toBe('MAX_TOKENS');
  });

  it('should have TOOL_CALLS value', () => {
    expect(FinishReason.TOOL_CALLS).toBe('TOOL_CALLS');
  });

  it('should have ERROR value', () => {
    expect(FinishReason.ERROR).toBe('ERROR');
  });

  it('should have all expected values', () => {
    expect(FinishReason.FINISH_REASON_UNSPECIFIED).toBe('FINISH_REASON_UNSPECIFIED');
    expect(FinishReason.SAFETY).toBe('SAFETY');
    expect(FinishReason.RECITATION).toBe('RECITATION');
    expect(FinishReason.OTHER).toBe('OTHER');
  });
});

describe('Type', () => {
  it('should have STRING type', () => {
    expect(Type.STRING).toBe('string');
  });

  it('should have NUMBER type', () => {
    expect(Type.NUMBER).toBe('number');
  });

  it('should have INTEGER type', () => {
    expect(Type.INTEGER).toBe('integer');
  });

  it('should have BOOLEAN type', () => {
    expect(Type.BOOLEAN).toBe('boolean');
  });

  it('should have ARRAY type', () => {
    expect(Type.ARRAY).toBe('array');
  });

  it('should have OBJECT type', () => {
    expect(Type.OBJECT).toBe('object');
  });

  it('should have NULL type', () => {
    expect(Type.NULL).toBe('null');
  });
});

describe('isTextPart', () => {
  it('should return true for text part', () => {
    const part: Part = { text: 'Hello' };
    expect(isTextPart(part)).toBe(true);
  });

  it('should return false for function call part', () => {
    const part: Part = { functionCall: { name: 'test', args: {} } };
    expect(isTextPart(part)).toBe(false);
  });

  it('should return false for inline data part', () => {
    const part: Part = { inlineData: { mimeType: 'text/plain', data: 'test' } };
    expect(isTextPart(part)).toBe(false);
  });

  it('should return false for empty object', () => {
    const part: Part = {};
    expect(isTextPart(part)).toBe(false);
  });
});

describe('isFunctionCallPart', () => {
  it('should return true for function call part', () => {
    const part: Part = { functionCall: { name: 'test', args: {} } };
    expect(isFunctionCallPart(part)).toBe(true);
  });

  it('should return false for text part', () => {
    const part: Part = { text: 'Hello' };
    expect(isFunctionCallPart(part)).toBe(false);
  });

  it('should return false for function response part', () => {
    const part: Part = { functionResponse: { name: 'test', response: {} } };
    expect(isFunctionCallPart(part)).toBe(false);
  });
});

describe('isFunctionResponsePart', () => {
  it('should return true for function response part', () => {
    const part: Part = { functionResponse: { name: 'test', response: {} } };
    expect(isFunctionResponsePart(part)).toBe(true);
  });

  it('should return false for function call part', () => {
    const part: Part = { functionCall: { name: 'test', args: {} } };
    expect(isFunctionResponsePart(part)).toBe(false);
  });

  it('should return false for text part', () => {
    const part: Part = { text: 'Hello' };
    expect(isFunctionResponsePart(part)).toBe(false);
  });
});

describe('isInlineDataPart', () => {
  it('should return true for inline data part', () => {
    const part: Part = { inlineData: { mimeType: 'image/png', data: 'base64' } };
    expect(isInlineDataPart(part)).toBe(true);
  });

  it('should return false for text part', () => {
    const part: Part = { text: 'Hello' };
    expect(isInlineDataPart(part)).toBe(false);
  });

  it('should return false for file data part', () => {
    const part: Part = { fileData: { mimeType: 'image/png', fileUri: 'file://test' } };
    expect(isInlineDataPart(part)).toBe(false);
  });
});

describe('textContent', () => {
  it('should create content with user role', () => {
    const content = textContent('user', 'Hello');
    expect(content.role).toBe('user');
    expect(content.parts).toEqual([{ text: 'Hello' }]);
  });

  it('should create content with model role', () => {
    const content = textContent('model', 'Response');
    expect(content.role).toBe('model');
    expect(content.parts).toEqual([{ text: 'Response' }]);
  });

  it('should create content with system role', () => {
    const content = textContent('system', 'Instructions');
    expect(content.role).toBe('system');
  });

  it('should create content with tool role', () => {
    const content = textContent('tool', 'Result');
    expect(content.role).toBe('tool');
  });
});

describe('userContent', () => {
  it('should create user content with text only', () => {
    const content = userContent('Hello');
    expect(content.role).toBe('user');
    expect(content.parts).toHaveLength(1);
    expect(content.parts[0]).toEqual({ text: 'Hello' });
  });

  it('should create user content with additional parts', () => {
    const imagePart: InlineDataPart = {
      inlineData: { mimeType: 'image/png', data: 'base64' },
    };
    const content = userContent('Hello', imagePart);
    expect(content.parts).toHaveLength(2);
    expect(content.parts[0]).toEqual({ text: 'Hello' });
    expect(content.parts[1]).toEqual(imagePart);
  });
});

describe('modelContent', () => {
  it('should create model content with text only', () => {
    const content = modelContent('Response');
    expect(content.role).toBe('model');
    expect(content.parts).toHaveLength(1);
    expect(content.parts[0]).toEqual({ text: 'Response' });
  });

  it('should create model content with function calls', () => {
    const fc: FunctionCall = { name: 'test', args: { arg1: 'value' } };
    const content = modelContent('Response', fc);
    expect(content.parts).toHaveLength(2);
    expect(content.parts[0]).toEqual({ text: 'Response' });
    expect(content.parts[1]).toEqual({ functionCall: fc });
  });

  it('should create model content with multiple function calls', () => {
    const fc1: FunctionCall = { name: 'func1', args: {} };
    const fc2: FunctionCall = { name: 'func2', args: {} };
    const content = modelContent('', fc1, fc2);
    expect(content.parts).toHaveLength(3);
  });
});

describe('systemContent', () => {
  it('should create system content', () => {
    const content = systemContent('You are a helpful assistant');
    expect(content.role).toBe('system');
    expect(content.parts).toEqual([{ text: 'You are a helpful assistant' }]);
  });
});

describe('toolContent', () => {
  it('should create tool content with response', () => {
    const response = { result: 'success' };
    const content = toolContent('testFunction', response);
    expect(content.role).toBe('tool');
    expect(content.parts).toHaveLength(1);
    expect(content.parts[0].functionResponse?.name).toBe('testFunction');
    expect(content.parts[0].functionResponse?.response).toEqual(response);
  });

  it('should create tool content with id', () => {
    const content = toolContent('testFunction', { result: 'ok' }, 'call-123');
    expect(content.parts[0].functionResponse?.id).toBe('call-123');
  });
});

describe('normalizeParts', () => {
  it('should normalize string to text part', () => {
    const result = normalizeParts('Hello');
    expect(result).toEqual([{ text: 'Hello' }]);
  });

  it('should return single part as array', () => {
    const part: Part = { text: 'Hello' };
    const result = normalizeParts(part);
    expect(result).toEqual([part]);
  });

  it('should normalize array of strings', () => {
    const result = normalizeParts(['Hello', 'World']);
    expect(result).toEqual([{ text: 'Hello' }, { text: 'World' }]);
  });

  it('should normalize mixed array', () => {
    const part: Part = { text: 'Part' };
    const result = normalizeParts(['String', part]);
    expect(result).toEqual([{ text: 'String' }, part]);
  });

  it('should handle empty array', () => {
    const result = normalizeParts([]);
    expect(result).toEqual([]);
  });
});

describe('mcpToTool', () => {
  it('should convert MCP tool to callable tool', async () => {
    const mcpTool: Tool = {
      functionDeclarations: [{ name: 'test', description: 'Test function' }],
    };

    const callable = mcpToTool(mcpTool);
    const tool = await callable.tool();

    expect(tool.functionDeclarations).toHaveLength(1);
    expect(tool.functionDeclarations?.[0].name).toBe('test');
  });

  it('should handle undefined input', async () => {
    const callable = mcpToTool(undefined);
    const tool = await callable.tool();

    expect(tool.functionDeclarations).toEqual([]);
  });

  it('should handle non-object input', async () => {
    const callable = mcpToTool('not an object');
    const tool = await callable.tool();

    expect(tool.functionDeclarations).toEqual([]);
  });

  it('should handle object without functionDeclarations', async () => {
    const callable = mcpToTool({ other: 'property' });
    const tool = await callable.tool();

    expect(tool.functionDeclarations).toEqual([]);
  });
});

describe('createUserContent', () => {
  it('should create user content from string', () => {
    const content = createUserContent('Hello');
    expect(content.role).toBe('user');
    expect(content.parts).toEqual([{ text: 'Hello' }]);
  });

  it('should create user content from parts', () => {
    const parts = [{ text: 'Hello' }, { text: 'World' }];
    const content = createUserContent(parts);
    expect(content.parts).toEqual(parts);
  });

  it('should create user content from mixed array', () => {
    const content = createUserContent(['Hello', { text: 'World' }]);
    expect(content.parts).toEqual([{ text: 'Hello' }, { text: 'World' }]);
  });
});

describe('createModelContent', () => {
  it('should create model content from string', () => {
    const content = createModelContent('Response');
    expect(content.role).toBe('model');
    expect(content.parts).toEqual([{ text: 'Response' }]);
  });

  it('should create model content from parts', () => {
    const parts = [{ text: 'Response' }];
    const content = createModelContent(parts);
    expect(content.parts).toEqual(parts);
  });
});

describe('GenerateContentResponse', () => {
  it('should create empty response', () => {
    const response = new GenerateContentResponse();
    expect(response.candidates).toEqual([]);
    expect(response.usageMetadata).toBeUndefined();
  });

  it('should create response with partial data', () => {
    const response = new GenerateContentResponse({
      candidates: [{ index: 0, content: { role: 'model', parts: [{ text: 'Hello' }] } }],
    });

    expect(response.candidates).toHaveLength(1);
  });

  it('should create response with usage metadata', () => {
    const response = new GenerateContentResponse({
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 5,
        totalTokenCount: 15,
      },
    });

    expect(response.usageMetadata?.promptTokenCount).toBe(10);
    expect(response.usageMetadata?.candidatesTokenCount).toBe(5);
  });

  it('should create response with function calls', () => {
    const response = new GenerateContentResponse({
      functionCalls: [{ name: 'test', args: {} }],
    });

    expect(response.functionCalls).toHaveLength(1);
  });

  it('should handle modelVersion', () => {
    const response = new GenerateContentResponse({
      modelVersion: 'llama3.2',
    });

    expect(response.modelVersion).toBe('llama3.2');
  });

  it('should handle promptFeedback', () => {
    const response = new GenerateContentResponse({
      promptFeedback: {
        blockReason: 'SAFETY',
      },
    });

    expect(response.promptFeedback?.blockReason).toBe('SAFETY');
  });
});

describe('Type definitions', () => {
  describe('Part', () => {
    it('should allow text part', () => {
      const part: Part = { text: 'Hello' };
      expect(part.text).toBe('Hello');
    });

    it('should allow thought flag', () => {
      const part: Part = { text: 'Thinking...', thought: true };
      expect(part.thought).toBe(true);
    });

    it('should allow inlineData', () => {
      const part: Part = {
        inlineData: { mimeType: 'image/png', data: 'base64' },
      };
      expect(part.inlineData?.mimeType).toBe('image/png');
    });

    it('should allow functionCall', () => {
      const part: Part = {
        functionCall: { name: 'test', args: { arg: 'value' } },
      };
      expect(part.functionCall?.name).toBe('test');
    });

    it('should allow functionResponse', () => {
      const part: Part = {
        functionResponse: { name: 'test', response: { result: 'ok' } },
      };
      expect(part.functionResponse?.name).toBe('test');
    });
  });

  describe('FunctionCall', () => {
    it('should have required properties', () => {
      const fc: FunctionCall = { name: 'test', args: { a: 1 } };
      expect(fc.name).toBe('test');
      expect(fc.args).toEqual({ a: 1 });
    });

    it('should allow optional id', () => {
      const fc: FunctionCall = { name: 'test', args: {}, id: 'call-123' };
      expect(fc.id).toBe('call-123');
    });
  });

  describe('FunctionResponse', () => {
    it('should have required properties', () => {
      const fr: FunctionResponse = { name: 'test', response: { ok: true } };
      expect(fr.name).toBe('test');
      expect(fr.response).toEqual({ ok: true });
    });

    it('should allow optional id', () => {
      const fr: FunctionResponse = { name: 'test', response: {}, id: 'call-123' };
      expect(fr.id).toBe('call-123');
    });
  });

  describe('Schema', () => {
    it('should allow basic schema', () => {
      const schema: Schema = { type: 'string' };
      expect(schema.type).toBe('string');
    });

    it('should allow complex schema', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name' },
          age: { type: 'integer' },
        },
        required: ['name'],
      };

      expect(schema.type).toBe('object');
      expect(schema.properties?.name.type).toBe('string');
      expect(schema.required).toContain('name');
    });
  });

  describe('FunctionDeclaration', () => {
    it('should have required properties', () => {
      const decl: FunctionDeclaration = { name: 'test', description: 'Test function' };
      expect(decl.name).toBe('test');
      expect(decl.description).toBe('Test function');
    });

    it('should allow optional parameters', () => {
      const decl: FunctionDeclaration = {
        name: 'test',
        description: 'Test',
        parameters: { type: 'object', properties: { arg: { type: 'string' } } },
      };
      expect(decl.parameters).toBeDefined();
    });
  });

  describe('Tool', () => {
    it('should allow empty tool', () => {
      const tool: Tool = {};
      expect(tool.functionDeclarations).toBeUndefined();
    });

    it('should allow function declarations', () => {
      const tool: Tool = {
        functionDeclarations: [{ name: 'test', description: 'Test' }],
      };
      expect(tool.functionDeclarations).toHaveLength(1);
    });
  });

  describe('Content', () => {
    it('should have role and parts', () => {
      const content: Content = {
        role: 'user',
        parts: [{ text: 'Hello' }],
      };
      expect(content.role).toBe('user');
      expect(content.parts).toHaveLength(1);
    });
  });
});
