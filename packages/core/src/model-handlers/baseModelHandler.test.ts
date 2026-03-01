/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  createModelHandler,
  BaseModelHandler,
  BaseToolCallParser,
  type CreateModelHandlerOptions,
  type ModelHandlerConfig,
} from './baseModelHandler.js';
import type {
  IModelHandler,
  IToolCallTextParser,
  ToolCallParseResult,
} from './types.js';

// Mock model-definitions
vi.mock('../model-definitions/index.js', () => ({
  supportsTools: (modelName: string) => modelName.includes('qwen'),
}));

import { vi } from 'vitest';

describe('createModelHandler', () => {
  it('should create a model handler with string pattern', () => {
    const handler = createModelHandler('test', {
      modelPattern: 'qwen',
      displayName: 'Test Model',
    });

    expect(handler.name).toBe('test');
    expect(handler.config.displayName).toBe('Test Model');
    expect(handler.canHandle('qwen-7b')).toBe(true);
    expect(handler.canHandle('llama-7b')).toBe(false);
  });

  it('should create a model handler with regex pattern', () => {
    const handler = createModelHandler('test', {
      modelPattern: /qwen|deepseek/i,
      displayName: 'Test Model',
    });

    expect(handler.canHandle('qwen-7b')).toBe(true);
    expect(handler.canHandle('deepseek-33b')).toBe(true);
    expect(handler.canHandle('llama-7b')).toBe(false);
  });

  it('should include default parsers by default', () => {
    const handler = createModelHandler('test', {
      modelPattern: 'test',
      displayName: 'Test',
    });

    const content = '<tool_call={"name": "test", "arguments": {}}>';
    const result = handler.parseToolCalls(content);
    expect(result.toolCalls).toHaveLength(1);
  });

  it('should exclude default parsers when includeDefaultParsers is false', () => {
    const handler = createModelHandler(
      'test',
      {
        modelPattern: 'test',
        displayName: 'Test',
      },
      { includeDefaultParsers: false },
    );

    const content = '<tool_call={"name": "test", "arguments": {}}>';
    const result = handler.parseToolCalls(content);
    expect(result.toolCalls).toHaveLength(0);
  });

  it('should include custom parsers', () => {
    const customParser: IToolCallTextParser = {
      name: 'custom',
      priority: 1,
      canParse: () => true,
      parse: (content: string) => ({
        toolCalls: [{ name: 'custom-tool', args: {} }],
        cleanedContent: content,
      }),
    };

    const handler = createModelHandler(
      'test',
      {
        modelPattern: 'test',
        displayName: 'Test',
      },
      { parsers: [customParser] },
    );

    const result = handler.parseToolCalls('test content');
    expect(result.toolCalls.some((tc) => tc.name === 'custom-tool')).toBe(true);
  });

  it('should sort parsers by priority', () => {
    const parser1: IToolCallTextParser = {
      name: 'parser1',
      priority: 50,
      canParse: () => true,
      parse: () => ({
        toolCalls: [{ name: 'parser1-tool', args: {} }],
        cleanedContent: '',
      }),
    };

    const parser2: IToolCallTextParser = {
      name: 'parser2',
      priority: 1, // Higher priority (lower number)
      canParse: () => true,
      parse: () => ({
        toolCalls: [{ name: 'parser2-tool', args: {} }],
        cleanedContent: '',
      }),
    };

    const handler = createModelHandler(
      'test',
      {
        modelPattern: 'test',
        displayName: 'Test',
      },
      { parsers: [parser1, parser2], includeDefaultParsers: false },
    );

    const result = handler.parseToolCalls('test');
    // Parser2 should run first due to lower priority number
    expect(result.toolCalls[0].name).toBe('parser2-tool');
  });
});

describe('BaseModelHandler', () => {
  // Create a concrete implementation for testing
  class TestModelHandler extends BaseModelHandler {
    readonly name = 'test';
    readonly config: ModelHandlerConfig = {
      modelPattern: /test/i,
      displayName: 'Test Model',
    };

    constructor() {
      super();
      // Add a test parser
      this.parsers = [
        {
          name: 'test-parser',
          priority: 10,
          canParse: (content: string) => content.includes('TEST_TOOL'),
          parse: (content: string): ToolCallParseResult => ({
            toolCalls: [{ name: 'test-tool', args: { arg: 'value' } }],
            cleanedContent: content.replace('TEST_TOOL', '').trim(),
          }),
        },
      ];
    }
  }

  let handler: TestModelHandler;

  beforeEach(() => {
    handler = new TestModelHandler();
  });

  describe('canHandle', () => {
    it('should return true for matching models with regex pattern', () => {
      expect(handler.canHandle('test-model')).toBe(true);
      expect(handler.canHandle('TEST-model')).toBe(true);
    });

    it('should return false for non-matching models', () => {
      expect(handler.canHandle('other-model')).toBe(false);
    });
  });

  describe('parseToolCalls', () => {
    it('should parse tool calls using registered parsers', () => {
      const result = handler.parseToolCalls('TEST_TOOL some content');
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test-tool');
    });

    it('should return empty array for content without tool calls', () => {
      const result = handler.parseToolCalls('no tool calls here');
      expect(result.toolCalls).toHaveLength(0);
      expect(result.cleanedContent).toBe('no tool calls here');
    });

    it('should clean content after parsing', () => {
      const result = handler.parseToolCalls('TEST_TOOL remaining');
      expect(result.cleanedContent).toBe('remaining');
    });
  });
});

describe('BaseToolCallParser', () => {
  class TestParser extends BaseToolCallParser {
    readonly name = 'test-parser';
    readonly priority = 100;

    canParse(content: string): boolean {
      return content.includes('TEST');
    }

    parse(content: string): ToolCallParseResult {
      return {
        toolCalls: [{ name: 'parsed-tool', args: {} }],
        cleanedContent: content.replace('TEST', ''),
      };
    }
  }

  let parser: TestParser;

  beforeEach(() => {
    parser = new TestParser();
  });

  it('should have correct name', () => {
    expect(parser.name).toBe('test-parser');
  });

  it('should have default priority of 100', () => {
    expect(parser.priority).toBe(100);
  });

  it('should check if content can be parsed', () => {
    expect(parser.canParse('TEST content')).toBe(true);
    expect(parser.canParse('no test here')).toBe(false);
  });

  it('should parse content', () => {
    const result = parser.parse('TEST content');
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe('parsed-tool');
    expect(result.cleanedContent).toBe(' content');
  });
});

describe('ModelHandlerConfig type', () => {
  it('should accept valid config', () => {
    const config: ModelHandlerConfig = {
      modelPattern: /test/i,
      displayName: 'Test',
      description: 'Test model handler',
      supportsStructuredToolCalls: true,
      supportsTextToolCalls: true,
      supportsTools: true,
      supportsThinking: false,
      maxContextLength: 4096,
      customOptions: { test: true },
    };

    expect(config.displayName).toBe('Test');
  });
});

describe('CreateModelHandlerOptions type', () => {
  it('should accept valid options', () => {
    const options: CreateModelHandlerOptions = {
      parsers: [],
      includeDefaultParsers: true,
      supportsToolsFn: () => true,
      toolsSupportPattern: /tools/i,
    };

    expect(options.includeDefaultParsers).toBe(true);
  });
});
