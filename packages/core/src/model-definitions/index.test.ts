/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type ModelCapabilities,
  type ModelDefinition,
  type ModelFamilyDefinition,
  type ToolCallFormat,
  // Registry exports
  DEFAULT_VISION_MODEL,
  MODEL_FAMILIES,
  findModelFamily,
  getDefaultVisionModel,
  getModelCapabilities,
  getModelDefinition,
  getToolCallFormat,
  supportsThinking,
  supportsTools,
  supportsVision,
} from './index.js';

describe('Model Definitions Module Index', () => {
  describe('Type exports', () => {
    it('should export ModelCapabilities type', () => {
      const caps: ModelCapabilities = {
        tools: true,
        vision: false,
        thinking: false,
        structuredOutput: true,
      };
      expect(caps.tools).toBe(true);
    });

    it('should export ToolCallFormat type', () => {
      const format: ToolCallFormat = 'qwen';
      expect(format).toBe('qwen');
    });

    it('should export ModelFamilyDefinition type', () => {
      const family: ModelFamilyDefinition = {
        id: 'test',
        displayName: 'Test',
        pattern: /test/i,
        defaultCapabilities: { tools: false },
        defaultOutputFormat: 'native',
      };
      expect(family.id).toBe('test');
    });

    it('should export ModelDefinition type', () => {
      const def: ModelDefinition = {
        modelName: 'test',
        family: {
          id: 'test',
          displayName: 'Test',
          pattern: /test/i,
          defaultCapabilities: { tools: false },
          defaultOutputFormat: 'native',
        },
        capabilities: {
          tools: false,
          vision: false,
          thinking: false,
          structuredOutput: false,
        },
        outputFormat: 'native',
      };
      expect(def.modelName).toBe('test');
    });
  });

  describe('Constant exports', () => {
    it('should export DEFAULT_VISION_MODEL', () => {
      expect(DEFAULT_VISION_MODEL).toBe('llava');
    });

    it('should export MODEL_FAMILIES', () => {
      expect(Array.isArray(MODEL_FAMILIES)).toBe(true);
      expect(MODEL_FAMILIES.length).toBeGreaterThan(0);
    });
  });

  describe('Function exports', () => {
    it('should export findModelFamily', () => {
      expect(typeof findModelFamily).toBe('function');
      const family = findModelFamily('qwen3-coder');
      expect(family?.id).toBe('qwen');
    });

    it('should export getDefaultVisionModel', () => {
      expect(typeof getDefaultVisionModel).toBe('function');
      expect(getDefaultVisionModel()).toBe('llava');
    });

    it('should export getModelCapabilities', () => {
      expect(typeof getModelCapabilities).toBe('function');
      const caps = getModelCapabilities('llama3.2');
      expect(caps).toBeDefined();
    });

    it('should export getModelDefinition', () => {
      expect(typeof getModelDefinition).toBe('function');
      const def = getModelDefinition('qwen3-coder');
      expect(def.modelName).toBe('qwen3-coder');
    });

    it('should export getToolCallFormat', () => {
      expect(typeof getToolCallFormat).toBe('function');
      const format = getToolCallFormat('qwen3-coder');
      expect(format).toBe('qwen');
    });

    it('should export supportsThinking', () => {
      expect(typeof supportsThinking).toBe('function');
      expect(supportsThinking('deepseek-r1')).toBe(true);
    });

    it('should export supportsTools', () => {
      expect(typeof supportsTools).toBe('function');
      expect(supportsTools('qwen3-coder')).toBe(true);
    });

    it('should export supportsVision', () => {
      expect(typeof supportsVision).toBe('function');
      expect(supportsVision('llava')).toBe(true);
    });
  });
});
