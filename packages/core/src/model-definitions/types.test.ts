/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  type ModelCapabilities,
  type ModelDefinition,
  type ModelFamilyDefinition,
  type ToolCallFormat,
} from './types.js';

describe('ModelCapabilities type', () => {
  it('should accept valid capabilities', () => {
    const caps: ModelCapabilities = {
      tools: true,
      vision: false,
      thinking: false,
      structuredOutput: true,
    };

    expect(caps.tools).toBe(true);
    expect(caps.vision).toBe(false);
    expect(caps.thinking).toBe(false);
    expect(caps.structuredOutput).toBe(true);
  });

  it('should accept partial capabilities', () => {
    const caps: ModelCapabilities = {
      tools: true,
      vision: true,
      thinking: false,
      structuredOutput: false,
    };

    expect(caps.tools).toBe(true);
    expect(caps.vision).toBe(true);
  });
});

describe('ToolCallFormat type', () => {
  it('should accept native format', () => {
    const format: ToolCallFormat = 'native';
    expect(format).toBe('native');
  });

  it('should accept qwen format', () => {
    const format: ToolCallFormat = 'qwen';
    expect(format).toBe('qwen');
  });

  it('should accept mistral format', () => {
    const format: ToolCallFormat = 'mistral';
    expect(format).toBe('mistral');
  });

  it('should accept phi format', () => {
    const format: ToolCallFormat = 'phi';
    expect(format).toBe('phi');
  });

  it('should accept deepseek format', () => {
    const format: ToolCallFormat = 'deepseek';
    expect(format).toBe('deepseek');
  });

  it('should accept auto format', () => {
    const format: ToolCallFormat = 'auto';
    expect(format).toBe('auto');
  });
});

describe('ModelFamilyDefinition type', () => {
  it('should accept minimal family definition', () => {
    const family: ModelFamilyDefinition = {
      id: 'test',
      displayName: 'Test Family',
      pattern: /test/i,
      defaultCapabilities: { tools: false },
      defaultOutputFormat: 'native',
    };

    expect(family.id).toBe('test');
    expect(family.displayName).toBe('Test Family');
  });

  it('should accept full family definition', () => {
    const family: ModelFamilyDefinition = {
      id: 'test',
      displayName: 'Test Family',
      description: 'A test family',
      pattern: /test/i,
      defaultCapabilities: {
        tools: true,
        vision: false,
        thinking: false,
        structuredOutput: true,
      },
      defaultOutputFormat: 'qwen',
      modelOverrides: [
        {
          pattern: /test-pro/i,
          capabilities: { tools: true, vision: true },
        },
      ],
      detectCapabilities: (modelName: string) => {
        if (modelName.includes('pro')) {
          return { tools: true };
        }
        return null;
      },
    };

    expect(family.description).toBe('A test family');
    expect(family.modelOverrides).toHaveLength(1);
    expect(family.detectCapabilities).toBeDefined();
  });
});

describe('ModelDefinition type', () => {
  it('should accept valid model definition', () => {
    const def: ModelDefinition = {
      modelName: 'test-model',
      family: {
        id: 'test',
        displayName: 'Test',
        pattern: /test/i,
        defaultCapabilities: { tools: false },
        defaultOutputFormat: 'native',
      },
      capabilities: {
        tools: true,
        vision: false,
        thinking: false,
        structuredOutput: true,
      },
      outputFormat: 'qwen',
    };

    expect(def.modelName).toBe('test-model');
    expect(def.family.id).toBe('test');
    expect(def.capabilities.tools).toBe(true);
    expect(def.outputFormat).toBe('qwen');
  });
});
