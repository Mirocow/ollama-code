/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type ModelCapabilities,
  type ModelGenerationConfig,
  type ModelConfig,
  type ModelProvidersConfig,
  type ResolvedModelConfig,
  type AvailableModel,
  type ModelSwitchMetadata,
  type RuntimeModelSnapshot,
  // Classes
  ModelRegistry,
  ModelsConfig,
  type ModelsConfigOptions,
  type OnModelChangeCallback,
  // Constants
  AUTH_ENV_MAPPINGS,
  CREDENTIAL_FIELDS,
  DEFAULT_MODELS,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  MODEL_GENERATION_CONFIG_FIELDS,
  OLLAMA_MODELS,
  PROVIDER_SOURCED_FIELDS,
  // Functions
  resolveModelConfig,
  validateModelConfig,
} from './index.js';
import { AuthType } from '../core/contentGenerator.js';

describe('Models Module Index', () => {
  describe('Type exports', () => {
    it('should export ModelCapabilities type', () => {
      const caps: ModelCapabilities = { vision: true };
      expect(caps.vision).toBe(true);
    });

    it('should export ModelGenerationConfig type', () => {
      const config: ModelGenerationConfig = { timeout: 30000 };
      expect(config.timeout).toBe(30000);
    });

    it('should export ModelConfig type', () => {
      const config: ModelConfig = { id: 'test' };
      expect(config.id).toBe('test');
    });

    it('should export ModelProvidersConfig type', () => {
      const config: ModelProvidersConfig = {
        [AuthType.USE_OLLAMA]: [{ id: 'test' }],
      };
      expect(config[AuthType.USE_OLLAMA]).toHaveLength(1);
    });

    it('should export ResolvedModelConfig type', () => {
      const config: ResolvedModelConfig = {
        id: 'test',
        authType: AuthType.USE_OLLAMA,
        name: 'Test',
        baseUrl: 'http://localhost',
        generationConfig: {},
        capabilities: {},
      };
      expect(config.authType).toBe(AuthType.USE_OLLAMA);
    });

    it('should export AvailableModel type', () => {
      const model: AvailableModel = {
        id: 'test',
        label: 'Test',
        authType: AuthType.USE_OLLAMA,
      };
      expect(model.id).toBe('test');
    });

    it('should export ModelSwitchMetadata type', () => {
      const meta: ModelSwitchMetadata = { reason: 'test' };
      expect(meta.reason).toBe('test');
    });

    it('should export RuntimeModelSnapshot type', () => {
      const snapshot: RuntimeModelSnapshot = {
        id: '$runtime|test',
        authType: AuthType.USE_OLLAMA,
        modelId: 'test',
        sources: {},
        createdAt: Date.now(),
      };
      expect(snapshot.modelId).toBe('test');
    });
  });

  describe('Class exports', () => {
    it('should export ModelRegistry', () => {
      const registry = new ModelRegistry();
      expect(registry).toBeInstanceOf(ModelRegistry);
    });

    it('should export ModelsConfig', () => {
      const config = new ModelsConfig();
      expect(config).toBeInstanceOf(ModelsConfig);
    });
  });

  describe('Constant exports', () => {
    it('should export AUTH_ENV_MAPPINGS', () => {
      expect(AUTH_ENV_MAPPINGS).toBeDefined();
      expect(AUTH_ENV_MAPPINGS.ollama).toBeDefined();
    });

    it('should export CREDENTIAL_FIELDS', () => {
      expect(CREDENTIAL_FIELDS).toBeDefined();
      expect(Array.isArray(CREDENTIAL_FIELDS)).toBe(true);
    });

    it('should export DEFAULT_MODELS', () => {
      expect(DEFAULT_MODELS).toBeDefined();
      expect(DEFAULT_MODELS.ollama).toBe('llama3.2');
    });

    it('should export DEFAULT_OLLAMA_MODEL', () => {
      expect(DEFAULT_OLLAMA_MODEL).toBe('llama3.2');
    });

    it('should export DEFAULT_OLLAMA_EMBEDDING_MODEL', () => {
      expect(DEFAULT_OLLAMA_EMBEDDING_MODEL).toBe('nomic-embed-text');
    });

    it('should export MODEL_GENERATION_CONFIG_FIELDS', () => {
      expect(MODEL_GENERATION_CONFIG_FIELDS).toBeDefined();
      expect(Array.isArray(MODEL_GENERATION_CONFIG_FIELDS)).toBe(true);
    });

    it('should export OLLAMA_MODELS', () => {
      expect(OLLAMA_MODELS).toBeDefined();
      expect(Array.isArray(OLLAMA_MODELS)).toBe(true);
    });

    it('should export PROVIDER_SOURCED_FIELDS', () => {
      expect(PROVIDER_SOURCED_FIELDS).toBeDefined();
      expect(Array.isArray(PROVIDER_SOURCED_FIELDS)).toBe(true);
    });
  });

  describe('Function exports', () => {
    it('should export resolveModelConfig', () => {
      expect(typeof resolveModelConfig).toBe('function');
    });

    it('should export validateModelConfig', () => {
      expect(typeof validateModelConfig).toBe('function');
    });
  });

  describe('ModelsConfigOptions type', () => {
    it('should accept valid options', () => {
      const options: ModelsConfigOptions = {
        initialAuthType: AuthType.USE_OLLAMA,
        modelProvidersConfig: {},
        generationConfig: { model: 'test' },
        generationConfigSources: {},
        onModelChange: async () => {},
      };

      expect(options.initialAuthType).toBe(AuthType.USE_OLLAMA);
    });
  });

  describe('OnModelChangeCallback type', () => {
    it('should accept valid callback', async () => {
      const callback: OnModelChangeCallback = async (authType, requiresRefresh) => {
        expect(authType).toBeDefined();
        expect(typeof requiresRefresh).toBe('boolean');
      };

      await callback(AuthType.USE_OLLAMA, true);
    });
  });
});
