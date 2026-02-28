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
  GemmaModelHandler,
  PhiModelHandler,
  CommandModelHandler,
  YiModelHandler,
  LlavaModelHandler,
  SolarModelHandler,
  StarCoderModelHandler,
  DbrxModelHandler,
  GraniteModelHandler,
} from './index.js';

describe('Model Handlers', () => {
  describe('DefaultModelHandler', () => {
    const handler = DefaultModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('default');
      expect(handler.config.displayName).toBe('Default');
    });

    it('should handle any model', () => {
      expect(handler.canHandle('any-model')).toBe(true);
      expect(handler.canHandle('unknown-model')).toBe(true);
    });

    it('should parse tool_call tag format', () => {
      const content =
        '<tool_call={"name": "list_directory", "arguments": {"path": "/home"}}>';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('list_directory');
      expect(result.toolCalls[0].args).toEqual({ path: '/home' });
    });

    it('should parse tool_call_start/end format', () => {
      const content =
        '<tool_call_start>{"name": "read_file", "arguments": {"path": "/test.txt"}}<tool_call_end>';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('read_file');
    });

    it('should parse function call format', () => {
      const content =
        '{"type": "function", "function": {"name": "run_shell_command", "arguments": "{\\"command\\": \\"ls\\"}"}}';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('run_shell_command');
      expect(result.toolCalls[0].args).toEqual({ command: 'ls' });
    });

    it('should parse standalone JSON format', () => {
      const content =
        'Let me help you.\n{"name": "edit", "arguments": {"path": "/file.ts"}}';
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
    const handler = QwenModelHandler;

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

    it('should support tools for all qwen models', () => {
      // Qwen-Coder variants
      expect(handler.supportsTools!('qwen3-coder:30b')).toBe(true);
      expect(handler.supportsTools!('qwen2.5-coder:7b')).toBe(true);
      // QwQ reasoning models
      expect(handler.supportsTools!('qwq:32b')).toBe(true);
      // Qwen3 tools variant
      expect(handler.supportsTools!('qwen3-tools:30b')).toBe(true);
      // Qwen2.5 instruct
      expect(handler.supportsTools!('qwen2.5-instruct:7b')).toBe(true);
    });

    it('should NOT support tools for base qwen2.5 models without instruct', () => {
      expect(handler.supportsTools!('qwen2.5:7b')).toBe(false);
    });

    it('should parse Qwen tool_call format', () => {
      const content =
        '<tool_call={"name": "test_tool", "arguments": {"arg1": "value1"}}>';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test_tool');
    });
  });

  describe('LlamaModelHandler', () => {
    const handler = LlamaModelHandler;

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

    it('should support tools for llama3.1+ but not llama2', () => {
      expect(handler.supportsTools!('llama3.1:70b')).toBe(true);
      expect(handler.supportsTools!('llama3.2:latest')).toBe(true);
      expect(handler.supportsTools!('codellama:34b')).toBe(true);
      // llama2 doesn't support tools
      expect(handler.supportsTools!('llama2:70b')).toBe(false);
    });
  });

  describe('DeepSeekModelHandler', () => {
    const handler = DeepSeekModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('deepseek');
      expect(handler.config.displayName).toBe('DeepSeek');
    });

    it('should handle deepseek models', () => {
      expect(handler.canHandle('deepseek-coder:33b')).toBe(true);
      expect(handler.canHandle('deepseek-r1:70b')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should support tools for all deepseek models', () => {
      expect(handler.supportsTools!('deepseek-coder:33b')).toBe(true);
      expect(handler.supportsTools!('deepseek-r1:70b')).toBe(true);
    });
  });

  describe('MistralModelHandler', () => {
    const handler = MistralModelHandler;

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

    it('should support tools for mistral instruct and codestral models', () => {
      // Codestral
      expect(handler.supportsTools!('codestral:22b')).toBe(true);
      // Mixtral
      expect(handler.supportsTools!('mixtral:8x7b')).toBe(true);
      // Mistral instruct variants
      expect(handler.supportsTools!('mistral:7b-instruct')).toBe(true);
      // Mistral Small/Medium/Large
      expect(handler.supportsTools!('mistral-small:24b')).toBe(true);
      expect(handler.supportsTools!('mistral-large:123b')).toBe(true);
    });

    it('should NOT support tools for base mistral:7b without instruct', () => {
      expect(handler.supportsTools!('mistral:7b')).toBe(false);
      expect(handler.supportsTools!('mistral:latest')).toBe(false);
    });

    it('should parse [TOOL_CALLS] format', () => {
      const content =
        '[TOOL_CALLS] [{"name": "get_weather", "arguments": {"location": "Paris"}}]';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('get_weather');
      expect(result.toolCalls[0].args).toEqual({ location: 'Paris' });
    });

    it('should parse code block format', () => {
      const content =
        '```json\n{"name": "list_files", "arguments": {"path": "/home"}}\n```';
      const result = handler.parseToolCalls(content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('list_files');
    });
  });

  describe('GemmaModelHandler', () => {
    const handler = GemmaModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('gemma');
      expect(handler.config.displayName).toBe('Gemma');
    });

    it('should handle gemma models', () => {
      expect(handler.canHandle('gemma-2-9b')).toBe(true);
      expect(handler.canHandle('gemma-3-27b')).toBe(true);
      expect(handler.canHandle('codegemma:7b')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should support tools for Gemma 3 and CodeGemma', () => {
      expect(handler.supportsTools!('gemma-3-27b')).toBe(true);
      expect(handler.supportsTools!('codegemma:7b')).toBe(true);
    });

    it('should NOT support tools for Gemma 2 base', () => {
      expect(handler.supportsTools!('gemma-2-9b')).toBe(false);
    });

    it('should support tools for Gemma 2 instruct', () => {
      expect(handler.supportsTools!('gemma-2-9b-it')).toBe(true);
    });
  });

  describe('PhiModelHandler', () => {
    const handler = PhiModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('phi');
      expect(handler.config.displayName).toBe('Phi');
    });

    it('should handle phi models', () => {
      expect(handler.canHandle('phi-3-mini:3.8b')).toBe(true);
      expect(handler.canHandle('phi-3.5:3.8b')).toBe(true);
      expect(handler.canHandle('phi-4:14b')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should support tools for Phi 3+ models', () => {
      expect(handler.supportsTools!('phi-3-mini:3.8b')).toBe(true);
      expect(handler.supportsTools!('phi-3.5:3.8b')).toBe(true);
      expect(handler.supportsTools!('phi-4:14b')).toBe(true);
    });

    it('should NOT support tools for Phi 2', () => {
      expect(handler.supportsTools!('phi-2:2.7b')).toBe(false);
    });
  });

  describe('CommandModelHandler', () => {
    const handler = CommandModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('command');
      expect(handler.config.displayName).toBe('Command');
    });

    it('should handle command models', () => {
      expect(handler.canHandle('command-r:35b')).toBe(true);
      expect(handler.canHandle('command-r-plus:104b')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should support tools for all Command models', () => {
      expect(handler.supportsTools!('command-r:35b')).toBe(true);
      expect(handler.supportsTools!('command-r-plus:104b')).toBe(true);
    });
  });

  describe('YiModelHandler', () => {
    const handler = YiModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('yi');
      expect(handler.config.displayName).toBe('Yi');
    });

    it('should handle yi models', () => {
      expect(handler.canHandle('yi-34b')).toBe(true);
      expect(handler.canHandle('yi-coder:9b')).toBe(true);
      expect(handler.canHandle('yi-large')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should support tools for Yi-Coder and Yi-Large', () => {
      expect(handler.supportsTools!('yi-coder:9b')).toBe(true);
      expect(handler.supportsTools!('yi-large')).toBe(true);
      expect(handler.supportsTools!('yi-chat:34b')).toBe(true);
    });

    it('should NOT support tools for base Yi models', () => {
      expect(handler.supportsTools!('yi-34b')).toBe(false);
    });
  });

  describe('LlavaModelHandler', () => {
    const handler = LlavaModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('llava');
      expect(handler.config.displayName).toBe('LLaVA');
    });

    it('should handle llava and vision models', () => {
      expect(handler.canHandle('llava:13b')).toBe(true);
      expect(handler.canHandle('llava-v1.6')).toBe(true);
      expect(handler.canHandle('bakllava')).toBe(true);
      expect(handler.canHandle('moondream')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should NOT support tools for vision models', () => {
      expect(handler.supportsTools!('llava:13b')).toBe(false);
      expect(handler.supportsTools!('moondream')).toBe(false);
    });
  });

  describe('SolarModelHandler', () => {
    const handler = SolarModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('solar');
      expect(handler.config.displayName).toBe('Solar');
    });

    it('should handle solar models', () => {
      expect(handler.canHandle('solar-10.7b')).toBe(true);
      expect(handler.canHandle('solar-pro')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should support tools for Solar Pro and instruct variants', () => {
      expect(handler.supportsTools!('solar-pro')).toBe(true);
      expect(handler.supportsTools!('solar-10.7b-instruct')).toBe(true);
    });

    it('should NOT support tools for base Solar', () => {
      expect(handler.supportsTools!('solar-10.7b')).toBe(false);
    });
  });

  describe('StarCoderModelHandler', () => {
    const handler = StarCoderModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('starcoder');
      expect(handler.config.displayName).toBe('StarCoder');
    });

    it('should handle starcoder models', () => {
      expect(handler.canHandle('starcoder2:15b')).toBe(true);
      expect(handler.canHandle('stable-code:7b')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should NOT support tools for code models', () => {
      expect(handler.supportsTools!('starcoder2:15b')).toBe(false);
      expect(handler.supportsTools!('stable-code:7b')).toBe(false);
    });
  });

  describe('DbrxModelHandler', () => {
    const handler = DbrxModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('dbrx');
      expect(handler.config.displayName).toBe('DBRX');
    });

    it('should handle dbrx models', () => {
      expect(handler.canHandle('dbrx:132b')).toBe(true);
      expect(handler.canHandle('dbrx-instruct')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should support tools for DBRX instruct', () => {
      expect(handler.supportsTools!('dbrx-instruct')).toBe(true);
    });

    it('should NOT support tools for base DBRX', () => {
      expect(handler.supportsTools!('dbrx:132b')).toBe(false);
    });
  });

  describe('GraniteModelHandler', () => {
    const handler = GraniteModelHandler;

    it('should have correct config', () => {
      expect(handler.name).toBe('granite');
      expect(handler.config.displayName).toBe('Granite');
    });

    it('should handle granite models', () => {
      expect(handler.canHandle('granite-3b')).toBe(true);
      expect(handler.canHandle('granite-code:34b')).toBe(true);
      expect(handler.canHandle('granite-3.0-instruct')).toBe(true);
      expect(handler.canHandle('llama3.2')).toBe(false);
    });

    it('should support tools for Granite code and instruct', () => {
      expect(handler.supportsTools!('granite-code:34b')).toBe(true);
      expect(handler.supportsTools!('granite-instruct')).toBe(true);
      expect(handler.supportsTools!('granite-3.0:8b')).toBe(true);
    });

    it('should NOT support tools for base Granite', () => {
      expect(handler.supportsTools!('granite-7b')).toBe(false);
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
      expect(names).toContain('gemma');
      expect(names).toContain('phi');
      expect(names).toContain('command');
      expect(names).toContain('yi');
      expect(names).toContain('llava');
      expect(names).toContain('solar');
      expect(names).toContain('starcoder');
      expect(names).toContain('dbrx');
      expect(names).toContain('granite');
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

    it('should return Gemma handler for gemma models', () => {
      const handler = factory.getHandler('gemma-3-27b');
      expect(handler.name).toBe('gemma');
    });

    it('should return Phi handler for phi models', () => {
      const handler = factory.getHandler('phi-3-mini:3.8b');
      expect(handler.name).toBe('phi');
    });

    it('should return Command handler for command models', () => {
      const handler = factory.getHandler('command-r:35b');
      expect(handler.name).toBe('command');
    });

    it('should return Yi handler for yi models', () => {
      const handler = factory.getHandler('yi-34b');
      expect(handler.name).toBe('yi');
    });

    it('should return LLaVA handler for llava models', () => {
      const handler = factory.getHandler('llava:13b');
      expect(handler.name).toBe('llava');
    });

    it('should return Solar handler for solar models', () => {
      const handler = factory.getHandler('solar-10.7b');
      expect(handler.name).toBe('solar');
    });

    it('should return StarCoder handler for starcoder models', () => {
      const handler = factory.getHandler('starcoder2:15b');
      expect(handler.name).toBe('starcoder');
    });

    it('should return DBRX handler for dbrx models', () => {
      const handler = factory.getHandler('dbrx-instruct');
      expect(handler.name).toBe('dbrx');
    });

    it('should return Granite handler for granite models', () => {
      const handler = factory.getHandler('granite-3b');
      expect(handler.name).toBe('granite');
    });

    it('should return default handler for unknown models', () => {
      const handler = factory.getHandler('unknown-model');
      expect(handler.name).toBe('default');
    });
  });

  describe('supportsTools', () => {
    it('should return true for qwen models', () => {
      expect(factory.supportsTools('qwen3-coder:30b')).toBe(true);
      expect(factory.supportsTools('qwen2.5-coder:14b')).toBe(true);
      expect(factory.supportsTools('qwq:32b')).toBe(true);
    });

    it('should return true for mistral instruct models', () => {
      expect(factory.supportsTools('mistral:7b-instruct')).toBe(true);
      expect(factory.supportsTools('mixtral:8x7b')).toBe(true);
      expect(factory.supportsTools('codestral:22b')).toBe(true);
    });

    it('should return false for base mistral:7b', () => {
      expect(factory.supportsTools('mistral:7b')).toBe(false);
    });

    it('should return true for deepseek models', () => {
      expect(factory.supportsTools('deepseek-coder:33b')).toBe(true);
      expect(factory.supportsTools('deepseek-r1:70b')).toBe(true);
    });

    it('should return true for llama3.1+ models', () => {
      expect(factory.supportsTools('llama3.1:70b')).toBe(true);
      expect(factory.supportsTools('llama3.2:latest')).toBe(true);
      expect(factory.supportsTools('codellama:34b')).toBe(true);
    });

    it('should return false for unknown models', () => {
      expect(factory.supportsTools('unknown-model')).toBe(false);
      expect(factory.supportsTools('random-model:7b')).toBe(false);
    });

    it('should use specific handlers for gemma, phi, command models', () => {
      // These models now have dedicated handlers
      expect(factory.getHandler('gemma-3-27b').name).toBe('gemma');
      expect(factory.getHandler('phi-3-mini').name).toBe('phi');
      expect(factory.getHandler('command-r:35b').name).toBe('command');
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
        parseToolCalls: (content: string) => ({
          toolCalls: [],
          cleanedContent: content,
        }),
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
