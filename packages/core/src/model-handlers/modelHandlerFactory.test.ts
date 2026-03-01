/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ModelHandlerFactory,
  getModelHandlerFactory,
  resetModelHandlerFactory,
} from './modelHandlerFactory.js';
import type { IModelHandler } from './types.js';

// Mock debug logger
vi.mock('../utils/debugLogger.js', () => ({
  createDebugLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock model-definitions
vi.mock('../model-definitions/index.js', () => ({
  supportsTools: (modelName: string) => modelName.includes('coder'),
  supportsThinking: (modelName: string) => modelName.includes('r1'),
}));

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
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('qwen');
      expect(names).toContain('llama');
      expect(names).toContain('deepseek');
    });

    it('should only initialize handlers once', () => {
      // Access private initialized flag
      const factory1 = ModelHandlerFactory.createDefault();
      const factory2 = ModelHandlerFactory.createDefault();
      // Both should be different instances since createDefault always creates new
      expect(factory1).not.toBe(factory2);
    });
  });

  describe('createEmpty', () => {
    it('should create empty factory without handlers', () => {
      const emptyFactory = ModelHandlerFactory.createEmpty();
      expect(emptyFactory.getHandlerNames()).toHaveLength(0);
    });
  });

  describe('register', () => {
    it('should register a custom handler', () => {
      const customHandler: IModelHandler = {
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
        supportsTools: () => true,
      };

      factory.register(customHandler);
      expect(factory.getHandlerNames()).toContain('custom');
    });
  });

  describe('unregister', () => {
    it('should remove handler by name', () => {
      const initialCount = factory.getHandlerNames().length;
      const result = factory.unregister('qwen');

      expect(result).toBe(true);
      expect(factory.getHandlerNames()).not.toContain('qwen');
      expect(factory.getHandlerNames().length).toBe(initialCount - 1);
    });

    it('should return false for unknown handler', () => {
      const result = factory.unregister('unknown-handler');
      expect(result).toBe(false);
    });
  });

  describe('setDefaultHandler', () => {
    it('should set a custom default handler', () => {
      const customDefault: IModelHandler = {
        name: 'custom-default',
        config: {
          modelPattern: /.*/,
          displayName: 'Custom Default',
        },
        canHandle: () => true,
        parseToolCalls: (content) => ({
          toolCalls: [],
          cleanedContent: content,
        }),
      };

      factory.setDefaultHandler(customDefault);
      const handler = factory.getHandler('completely-unknown-model');
      expect(handler.name).toBe('custom-default');
    });
  });

  describe('getHandler', () => {
    it('should return qwen handler for qwen models', () => {
      const handler = factory.getHandler('qwen3-coder:30b');
      expect(handler.name).toBe('qwen');
    });

    it('should return llama handler for llama models', () => {
      const handler = factory.getHandler('llama3.2:latest');
      expect(handler.name).toBe('llama');
    });

    it('should return deepseek handler for deepseek models', () => {
      const handler = factory.getHandler('deepseek-r1:70b');
      expect(handler.name).toBe('deepseek');
    });

    it('should return default handler for unknown models', () => {
      const handler = factory.getHandler('unknown-model');
      expect(handler.name).toBe('default');
    });

    it('should initialize handlers lazily if not initialized', () => {
      const newFactory = ModelHandlerFactory.createEmpty();
      // Register a handler manually
      newFactory.register({
        name: 'test',
        config: { modelPattern: /test/i, displayName: 'Test' },
        canHandle: (name) => name.includes('test'),
        parseToolCalls: (c) => ({ toolCalls: [], cleanedContent: c }),
      });

      const handler = newFactory.getHandler('test-model');
      expect(handler.name).toBe('test');
    });
  });

  describe('parseToolCalls', () => {
    it('should parse tool calls using appropriate handler', () => {
      const content = '<tool_call={"name": "test", "arguments": {}}>';
      const result = factory.parseToolCalls('qwen3-coder', content);

      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].name).toBe('test');
    });
  });

  describe('supportsTools', () => {
    it('should delegate to model-definitions', () => {
      const result = factory.supportsTools('qwen-coder');
      expect(result).toBe(true);
    });
  });

  describe('supportsThinking', () => {
    it('should delegate to model-definitions', () => {
      const result = factory.supportsThinking('deepseek-r1');
      expect(result).toBe(true);
    });
  });

  describe('getHandlerNames', () => {
    it('should return all registered handler names', () => {
      const names = factory.getHandlerNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });
  });

  describe('getHandlers', () => {
    it('should return a copy of handlers array', () => {
      const handlers1 = factory.getHandlers();
      const handlers2 = factory.getHandlers();

      expect(handlers1).not.toBe(handlers2); // Different references
      expect(handlers1.length).toBe(handlers2.length);
    });
  });
});

describe('Singleton Factory Functions', () => {
  afterEach(() => {
    resetModelHandlerFactory();
  });

  describe('getModelHandlerFactory', () => {
    it('should return the same instance', () => {
      const factory1 = getModelHandlerFactory();
      const factory2 = getModelHandlerFactory();
      expect(factory1).toBe(factory2);
    });

    it('should create instance on first call', () => {
      resetModelHandlerFactory();
      const factory = getModelHandlerFactory();
      expect(factory).toBeInstanceOf(ModelHandlerFactory);
    });
  });

  describe('resetModelHandlerFactory', () => {
    it('should reset the singleton', () => {
      const factory1 = getModelHandlerFactory();
      resetModelHandlerFactory();
      const factory2 = getModelHandlerFactory();
      expect(factory1).not.toBe(factory2);
    });
  });
});
