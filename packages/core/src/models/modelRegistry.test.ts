/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { ModelRegistry } from './modelRegistry.js';
import { AuthType } from '../core/contentGenerator.js';
import type { ModelConfig, ModelProvidersConfig } from './types.js';

// Mock debugLogger
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
  getModelCapabilities: () => ({ tools: true, vision: false, thinking: false, structuredOutput: true }),
  supportsVision: () => false,
}));

describe('ModelRegistry', () => {
  describe('constructor', () => {
    it('should create registry without config', () => {
      const registry = new ModelRegistry();
      expect(registry).toBeDefined();
    });

    it('should create registry with config', () => {
      const config: ModelProvidersConfig = {
        [AuthType.USE_OLLAMA]: [
          { id: 'custom-model', name: 'Custom Model' },
        ],
      };

      const registry = new ModelRegistry(config);
      const models = registry.getModelsForAuthType(AuthType.USE_OLLAMA);
      expect(models.some((m) => m.id === 'custom-model')).toBe(true);
    });

    it('should skip invalid authType keys', () => {
      const config = {
        invalid_auth_type: [{ id: 'test', name: 'Test' }],
      } as unknown as ModelProvidersConfig;

      const registry = new ModelRegistry(config);
      // Should not throw
      expect(registry).toBeDefined();
    });
  });

  describe('getModelsForAuthType', () => {
    it('should return empty array for unknown authType', () => {
      const registry = new ModelRegistry();
      const models = registry.getModelsForAuthType('unknown' as AuthType);
      expect(models).toEqual([]);
    });

    it('should return models for ollama authType', () => {
      const registry = new ModelRegistry();
      const models = registry.getModelsForAuthType(AuthType.USE_OLLAMA);

      expect(models.length).toBeGreaterThan(0);
      expect(models.some((m) => m.id === 'llama3.2')).toBe(true);
    });
  });

  describe('getModel', () => {
    it('should return model config for existing model', () => {
      const registry = new ModelRegistry();
      const model = registry.getModel(AuthType.USE_OLLAMA, 'llama3.2');

      expect(model).toBeDefined();
      expect(model?.id).toBe('llama3.2');
      expect(model?.name).toBe('Llama 3.2');
    });

    it('should return undefined for non-existent model', () => {
      const registry = new ModelRegistry();
      const model = registry.getModel(AuthType.USE_OLLAMA, 'non-existent-model');
      expect(model).toBeUndefined();
    });
  });

  describe('hasModel', () => {
    it('should return true for existing model', () => {
      const registry = new ModelRegistry();
      expect(registry.hasModel(AuthType.USE_OLLAMA, 'llama3.2')).toBe(true);
    });

    it('should return false for non-existent model', () => {
      const registry = new ModelRegistry();
      expect(registry.hasModel(AuthType.USE_OLLAMA, 'non-existent')).toBe(false);
    });
  });

  describe('getDefaultModelForAuthType', () => {
    it('should return default model for ollama', () => {
      const registry = new ModelRegistry();
      const model = registry.getDefaultModelForAuthType(AuthType.USE_OLLAMA);

      expect(model).toBeDefined();
      expect(model?.id).toBe('llama3.2');
    });

    it('should return undefined for empty authType', () => {
      const registry = new ModelRegistry();
      const model = registry.getDefaultModelForAuthType('unknown' as AuthType);
      expect(model).toBeUndefined();
    });

    it('should return first model for authType without default', () => {
      const config: ModelProvidersConfig = {
        [AuthType.USE_OLLAMA]: [
          { id: 'model-1', name: 'Model 1' },
          { id: 'model-2', name: 'Model 2' },
        ],
      };

      const registry = new ModelRegistry(config);
      // When no default is specified, first model is returned
      const model = registry.getDefaultModelForAuthType(AuthType.USE_OLLAMA);
      expect(model).toBeDefined();
    });
  });

  describe('reloadModels', () => {
    it('should reload models from new config', () => {
      const registry = new ModelRegistry();

      const newConfig: ModelProvidersConfig = {
        [AuthType.USE_OLLAMA]: [
          { id: 'new-model', name: 'New Model' },
        ],
      };

      registry.reloadModels(newConfig);

      const models = registry.getModelsForAuthType(AuthType.USE_OLLAMA);
      expect(models.some((m) => m.id === 'new-model')).toBe(true);
    });

    it('should clear existing models when reloading', () => {
      const registry = new ModelRegistry({
        [AuthType.USE_OLLAMA]: [{ id: 'old-model', name: 'Old Model' }],
      });

      registry.reloadModels({
        [AuthType.USE_OLLAMA]: [{ id: 'new-model', name: 'New Model' }],
      });

      const models = registry.getModelsForAuthType(AuthType.USE_OLLAMA);
      expect(models.some((m) => m.id === 'old-model')).toBe(false);
      expect(models.some((m) => m.id === 'new-model')).toBe(true);
    });

    it('should handle undefined config', () => {
      const registry = new ModelRegistry();
      registry.reloadModels(undefined);
      // Should not throw
    });
  });

  describe('validation', () => {
    it('should throw for model config without id', () => {
      const config = {
        [AuthType.USE_OLLAMA]: [{ name: 'No ID' } as unknown as ModelConfig],
      };

      expect(() => new ModelRegistry(config)).toThrow();
    });

    it('should handle duplicate model ids', () => {
      const config: ModelProvidersConfig = {
        [AuthType.USE_OLLAMA]: [
          { id: 'duplicate', name: 'First' },
          { id: 'duplicate', name: 'Second' },
        ],
      };

      // Should not throw, first one wins
      const registry = new ModelRegistry(config);
      const model = registry.getModel(AuthType.USE_OLLAMA, 'duplicate');
      expect(model?.name).toBe('First');
    });
  });

  describe('default Ollama models', () => {
    it('should include default Ollama models', () => {
      const registry = new ModelRegistry();
      const models = registry.getModelsForAuthType(AuthType.USE_OLLAMA);

      // Check some known default models
      expect(models.some((m) => m.id === 'llama3.2')).toBe(true);
      expect(models.some((m) => m.id === 'mistral')).toBe(true);
      expect(models.some((m) => m.id === 'codellama')).toBe(true);
    });

    it('should not override user models with defaults', () => {
      const config: ModelProvidersConfig = {
        [AuthType.USE_OLLAMA]: [
          { id: 'llama3.2', name: 'Custom Llama 3.2', description: 'Custom' },
        ],
      };

      const registry = new ModelRegistry(config);
      const model = registry.getModel(AuthType.USE_OLLAMA, 'llama3.2');

      expect(model?.name).toBe('Custom Llama 3.2');
    });
  });
});
