/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ModelHandlerFactory,
  getModelHandlerFactory,
  resetModelHandlerFactory,
  DefaultModelHandler,
  QwenModelHandler,
  LlamaModelHandler,
  DeepSeekModelHandler,
  MistralModelHandler,
} from './index.js';

describe('Model Handlers', () => {
  describe('DefaultModelHandler', () => {
    const handler = new DefaultModelHandler();

    it('should have correct config', () => {
      expect(handler.name).toBe('default');
      expect(handler.config.displayName).toBe('Default');
    });

    it('should handle any model', () => {
      expect(handler.canHandle('any-model')).toBe(true);
      expect(handler.canHandle('unknown-model')).toBe(true);
    });

    it('should parse tool_call tag format', () => {
      const content = '<tool_call={"name": "list_directory", "arguments": {"path": "/home"}}>';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('list_directory');
      expect(result.toolCalls[0].args).toEqual({ path: '/home' });
    });

    it('should parse tool_call_start/end format', () => {
      const content = '<tool_call_start>{"name": "read_file", "arguments": {"path": "/test.txt"}}<tool_call_end>';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('read_file');
    });

    it('should parse function call format', () => {
      const content = '{"type": "function", "function": {"name": "run_shell_command", "arguments": "{\\"command\\": \\"ls\\"}"}}';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('run_shell_command');
      expect(result.toolCalls[0].args).toEqual({ command: 'ls' });
    });

    it('should parse standalone JSON format', () => {
      const content = 'Let me help you.\n{"name": "edit", "arguments": {"path": "/file.ts"}}';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('edit');
    });

    it('should return empty array for content without tool calls', () => {
      const content = 'This is just regular text without any tool calls.';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(0);
      expect(result.cleanedContent).toBe(content);
    });
  });

  describe('QwenModelHandler', () => {
    const handler = new QwenModelHandler();

    it('should have correct config', () => {
      expect(handler.name).toBe('qwen');
      expect(handler.config.displayName).toBe('Qwen');
    });

    it('should handle qwen models', () => {
      expect(handler.canHandle('qwen3-coder:30b')).toBe(true);
      expect(handler.canHandle('qwen2.5-coder:7b')).toBe(true);
      expect(handler.canHandle('qwq:32b')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should parse Qwen tool_call format', () => {
      const content = '<tool_call={"name": "test_tool", "arguments": {"arg1": "value1"}}>';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test_tool');
    });
  });

  describe('LlamaModelHandler', () => {
    const handler = new LlamaModelHandler();

    it('should have correct config', () => {
      expect(handler.name).toBe('llama');
      expect(handler.config.displayName).toBe('Llama');
    });

    it('should handle llama models', () => {
      expect(handler.canHandle('llama3.2:latest')).toBe(true);
      expect(handler.canHandle('llama3.1:70b')).toBe(true);
      expect(handler.canHandle('codellama:34b')).toBe(true);
      expect(handler.canHandle('qwen3-coder')).toBe(false);
    });
  });

  describe('DeepSeekModelHandler', () => {
    const handler = new DeepSeekModelHandler();

    it('should have correct config', () => {
      expect(handler.name).toBe('deepseek');
      expect(handler.config.displayName).toBe('DeepSeek');
    });

    it('should handle deepseek models', () => {
      expect(handler.canHandle('deepseek-coder:33b')).toBe(true);
      expect(handler.canHandle('deepseek-r1:70b')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });
  });

  describe('MistralModelHandler', () => {
    const handler = new MistralModelHandler();

    it('should have correct config', () => {
      expect(handler.name).toBe('mistral');
      expect(handler.config.displayName).toBe('Mistral');
    });

    it('should handle mistral models', () => {
      expect(handler.canHandle('mistral:latest')).toBe(true);
      expect(handler.canHandle('mistral-small:24b')).toBe(true);
      expect(handler.canHandle('mistral-large:123b')).toBe(true);
      expect(handler.canHandle('mixtral:8x7b')).toBe(true);
      expect(handler.canHandle('codestral:22b')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should parse [TOOL_CALLS] format', () => {
      const content = '[TOOL_CALLS] [{"name": "get_weather", "arguments": {"location": "Paris"}}]';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('get_weather');
      expect(result.toolCalls[0].args).toEqual({ location: 'Paris' });
    });

    it('should parse code block format', () => {
      const content = '```json\n{"name": "list_files", "arguments": {"path": "/home"}}\n```';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('list_files');
    });
  });
});

describe('ModelHandlerFactory', () => {
  let factory: ModelHandlerFactory;

  beforeEach(() => {
    resetModelHandlerFactory();
    factory = ModelHandlerFactory.createDefault();
  });

  afterEach(() => {
    resetModelHandlerFactory();
  });

  describe('createDefault', () => {
    it('should create factory with default handlers', () => {
      const names = factory.getHandlerNames();
      expect(names).toContain('qwen');
      expect(names).toContain('llama');
      expect(names).toContain('deepseek');
      expect(names).toContain('mistral');
    });
  });

  describe('getHandler', () => {
    it('should return Qwen handler for qwen models', () => {
      const handler = factory.getHandler('qwen3-coder:30b');
      expect(handler.name).toBe('qwen');
    });

    it('should return Llama handler for llama models', () => {
      const handler = factory.getHandler('llama3.2:latest');
      expect(handler.name).toBe('llama');
    });

    it('should return DeepSeek handler for deepseek models', () => {
      const handler = factory.getHandler('deepseek-r1:70b');
      expect(handler.name).toBe('deepseek');
    });

    it('should return Mistral handler for mistral models', () => {
      const handler = factory.getHandler('mistral:latest');
      expect(handler.name).toBe('mistral');
    });

    it('should return Mistral handler for mixtral models', () => {
      const handler = factory.getHandler('mixtral:8x7b');
      expect(handler.name).toBe('mistral');
    });

    it('should return default handler for unknown models', () => {
      const handler = factory.getHandler('unknown-model');
      expect(handler.name).toBe('default');
    });
  });

  describe('parseToolCalls', () => {
    it('should parse tool calls using appropriate handler', () => {
      const content = '<tool_call={"name": "test", "arguments": {}}>';
      const result = factory.parseToolCalls('qwen3-coder', content);
      expect(result.toolCalls).toHaveLength(1);
    });
  });

  describe('register', () => {
    it('should register custom handler', () => {
      const customHandler = {
        name: 'custom',
        config: {
          modelPattern: /custom/i,
          displayName: 'Custom',
        },
        canHandle: (modelName: string) => /custom/i.test(modelName),
        parseToolCalls: (content: string) => ({ toolCalls: [], cleanedContent: content }),
      };

      factory.register(customHandler);
      expect(factory.getHandlerNames()).toContain('custom');
    });
  });

  describe('unregister', () => {
    it('should remove handler by name', () => {
      expect(factory.unregister('qwen')).toBe(true);
      expect(factory.getHandlerNames()).not.toContain('qwen');
    });

    it('should return false for unknown handler', () => {
      expect(factory.unregister('unknown')).toBe(false);
    });
  });
});

describe('Singleton Factory', () => {
  afterEach(() => {
    resetModelHandlerFactory();
  });

  it('should return same instance', () => {
    const factory1 = getModelHandlerFactory();
    const factory2 = getModelHandlerFactory();
    expect(factory1).toBe(factory2);
  });

  it('should reset singleton', () => {
    const factory1 = getModelHandlerFactory();
    resetModelHandlerFactory();
    const factory2 = getModelHandlerFactory();
    expect(factory1).not.toBe(factory2);
  });
});
