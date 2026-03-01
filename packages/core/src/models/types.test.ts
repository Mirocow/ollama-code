/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  type ModelCapabilities,
  type ModelGenerationConfig,
  type ModelConfig,
  type ModelProvidersConfig,
  type ResolvedModelConfig,
  type AvailableModel,
  type ModelSwitchMetadata,
  type RuntimeModelSnapshot,
} from './types.js';
import { AuthType } from '../core/contentGenerator.js';

describe('ModelCapabilities type', () => {
  it('should accept valid capabilities', () => {
    const capabilities: ModelCapabilities = {
      vision: true,
    };

    expect(capabilities.vision).toBe(true);
  });
});

describe('ModelGenerationConfig type', () => {
  it('should accept valid generation config', () => {
    const config: ModelGenerationConfig = {
      samplingParams: { temperature: 0.7 },
      timeout: 30000,
      maxRetries: 3,
      schemaCompliance: 'strict',
      reasoning: { effort: 'high' },
      contextWindowSize: 4096,
      customHeaders: { 'X-Custom': 'value' },
      extra_body: { custom: 'value' },
    };

    expect(config.timeout).toBe(30000);
  });

  it('should accept partial config', () => {
    const config: ModelGenerationConfig = {
      timeout: 60000,
    };

    expect(config.timeout).toBe(60000);
  });
});

describe('ModelConfig type', () => {
  it('should accept minimal config', () => {
    const config: ModelConfig = {
      id: 'test-model',
    };

    expect(config.id).toBe('test-model');
  });

  it('should accept full config', () => {
    const config: ModelConfig = {
      id: 'test-model',
      name: 'Test Model',
      description: 'A test model',
      envKey: 'TEST_API_KEY',
      baseUrl: 'https://api.test.com',
      capabilities: { vision: true },
      generationConfig: {
        timeout: 30000,
      },
    };

    expect(config.id).toBe('test-model');
    expect(config.envKey).toBe('TEST_API_KEY');
  });
});

describe('ModelProvidersConfig type', () => {
  it('should accept valid config', () => {
    const config: ModelProvidersConfig = {
      [AuthType.USE_OLLAMA]: [
        { id: 'model-1', name: 'Model 1' },
        { id: 'model-2', name: 'Model 2' },
      ],
    };

    expect(config[AuthType.USE_OLLAMA]).toHaveLength(2);
  });
});

describe('ResolvedModelConfig type', () => {
  it('should accept resolved config', () => {
    const config: ResolvedModelConfig = {
      id: 'test-model',
      authType: AuthType.USE_OLLAMA,
      name: 'Test Model',
      baseUrl: 'http://localhost:11434',
      generationConfig: {},
      capabilities: {},
    };

    expect(config.authType).toBe(AuthType.USE_OLLAMA);
    expect(config.baseUrl).toBe('http://localhost:11434');
  });
});

describe('AvailableModel type', () => {
  it('should accept minimal model', () => {
    const model: AvailableModel = {
      id: 'test-model',
      label: 'Test Model',
      authType: AuthType.USE_OLLAMA,
    };

    expect(model.id).toBe('test-model');
    expect(model.isRuntimeModel).toBeUndefined();
  });

  it('should accept full model info', () => {
    const model: AvailableModel = {
      id: 'test-model',
      label: 'Test Model',
      description: 'A test model',
      capabilities: { vision: true },
      authType: AuthType.USE_OLLAMA,
      isVision: true,
      contextWindowSize: 8192,
      isRuntimeModel: true,
      runtimeSnapshotId: '$runtime|ollama|test-model',
    };

    expect(model.isVision).toBe(true);
    expect(model.isRuntimeModel).toBe(true);
    expect(model.runtimeSnapshotId).toBe('$runtime|ollama|test-model');
  });
});

describe('ModelSwitchMetadata type', () => {
  it('should accept minimal metadata', () => {
    const metadata: ModelSwitchMetadata = {};

    expect(metadata.reason).toBeUndefined();
  });

  it('should accept full metadata', () => {
    const metadata: ModelSwitchMetadata = {
      reason: 'User requested switch',
      context: 'From CLI',
    };

    expect(metadata.reason).toBe('User requested switch');
    expect(metadata.context).toBe('From CLI');
  });
});

describe('RuntimeModelSnapshot type', () => {
  it('should accept valid snapshot', () => {
    const snapshot: RuntimeModelSnapshot = {
      id: '$runtime|ollama|test-model',
      authType: AuthType.USE_OLLAMA,
      modelId: 'test-model',
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com',
      apiKeyEnvKey: 'TEST_API_KEY',
      generationConfig: { timeout: 30000 },
      sources: {},
      createdAt: Date.now(),
    };

    expect(snapshot.id).toBe('$runtime|ollama|test-model');
    expect(snapshot.modelId).toBe('test-model');
  });

  it('should accept minimal snapshot', () => {
    const snapshot: RuntimeModelSnapshot = {
      id: '$runtime|ollama|test-model',
      authType: AuthType.USE_OLLAMA,
      modelId: 'test-model',
      sources: {},
      createdAt: Date.now(),
    };

    expect(snapshot.apiKey).toBeUndefined();
    expect(snapshot.baseUrl).toBeUndefined();
  });
});
