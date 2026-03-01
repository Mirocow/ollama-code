/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  resolveModelConfig,
  type ModelConfigSourcesInput,
  type ModelConfigCliInput,
  type ModelConfigSettingsInput,
} from './modelConfigResolver.js';
import { AuthType } from '../core/contentGenerator.js';

describe('resolveModelConfig', () => {
  describe('with minimal input', () => {
    it('should resolve with defaults', () => {
      const input: ModelConfigSourcesInput = {
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('llama3.2');
      expect(result.warnings).toEqual([]);
    });

    it('should resolve with authType but no other config', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.authType).toBe(AuthType.USE_OLLAMA);
      expect(result.config.model).toBe('llama3.2');
    });
  });

  describe('with CLI input', () => {
    it('should use CLI model', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        cli: { model: 'cli-model' },
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('cli-model');
      expect(result.sources['model']?.kind).toBe('cli');
    });

    it('should use CLI apiKey', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        cli: { apiKey: 'cli-api-key' },
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.apiKey).toBe('cli-api-key');
    });

    it('should use CLI baseUrl', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        cli: { baseUrl: 'https://cli.url' },
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.baseUrl).toBe('https://cli.url');
    });
  });

  describe('with environment input', () => {
    it('should use env model', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        env: { OLLAMA_MODEL: 'env-model' },
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('env-model');
      expect(result.sources['model']?.kind).toBe('env');
    });

    it('should use env apiKey', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        env: { OLLAMA_API_KEY: 'env-api-key' },
      };

      const result = resolveModelConfig(input);

      expect(result.config.apiKey).toBe('env-api-key');
    });

    it('should use env baseUrl', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        env: { OLLAMA_BASE_URL: 'https://env.url' },
      };

      const result = resolveModelConfig(input);

      expect(result.config.baseUrl).toBe('https://env.url');
    });

    it('should use OLLAMA_HOST as baseUrl', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        env: { OLLAMA_HOST: 'https://host.url' },
      };

      const result = resolveModelConfig(input);

      expect(result.config.baseUrl).toBe('https://host.url');
    });
  });

  describe('with settings input', () => {
    it('should use settings model', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        settings: { model: 'settings-model' },
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('settings-model');
      expect(result.sources['model']?.kind).toBe('settings');
    });

    it('should use settings apiKey', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        settings: { apiKey: 'settings-api-key' },
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.apiKey).toBe('settings-api-key');
    });

    it('should use settings generationConfig', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        settings: {
          generationConfig: {
            timeout: 60000,
            samplingParams: { temperature: 0.5 },
          },
        },
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.timeout).toBe(60000);
      expect(result.config.samplingParams).toEqual({ temperature: 0.5 });
    });
  });

  describe('with modelProvider input', () => {
    it('should use modelProvider config', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        modelProvider: {
          id: 'provider-model',
          baseUrl: 'https://provider.url',
          envKey: 'PROVIDER_API_KEY',
        },
        env: { PROVIDER_API_KEY: 'provider-key' },
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('provider-model');
      expect(result.config.baseUrl).toBe('https://provider.url');
      expect(result.config.apiKey).toBe('provider-key');
    });

    it('should use envKey from modelProvider for apiKey', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        modelProvider: {
          id: 'test-model',
          envKey: 'CUSTOM_KEY',
        },
        env: { CUSTOM_KEY: 'custom-value' },
      };

      const result = resolveModelConfig(input);

      expect(result.config.apiKey).toBe('custom-value');
      expect(result.config.apiKeyEnvKey).toBe('CUSTOM_KEY');
    });
  });

  describe('priority order', () => {
    it('should prefer CLI over env', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        cli: { model: 'cli-model' },
        env: { OLLAMA_MODEL: 'env-model' },
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('cli-model');
    });

    it('should prefer env over settings', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        settings: { model: 'settings-model' },
        env: { OLLAMA_MODEL: 'env-model' },
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('env-model');
    });

    it('should prefer settings over defaults', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        settings: { model: 'settings-model' },
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('settings-model');
    });

    it('should prefer modelProvider over CLI', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        modelProvider: {
          id: 'provider-model',
        },
        cli: { model: 'cli-model' },
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.model).toBe('provider-model');
    });
  });

  describe('source tracking', () => {
    it('should track sources correctly', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        cli: { model: 'cli-model' },
        env: { OLLAMA_API_KEY: 'env-key' },
        settings: { baseUrl: 'https://settings.url' },
      };

      const result = resolveModelConfig(input);

      expect(result.sources['model']?.kind).toBe('cli');
      expect(result.sources['apiKey']?.kind).toBe('env');
      expect(result.sources['baseUrl']?.kind).toBe('settings');
      expect(result.sources['authType']?.kind).toBe('computed');
    });
  });

  describe('with proxy', () => {
    it('should include proxy in config', () => {
      const input: ModelConfigSourcesInput = {
        authType: AuthType.USE_OLLAMA,
        env: {},
        proxy: 'https://proxy.url',
      };

      const result = resolveModelConfig(input);

      expect(result.config.proxy).toBe('https://proxy.url');
      expect(result.sources['proxy']?.kind).toBe('computed');
    });
  });

  describe('without authType', () => {
    it('should still resolve with defaults', () => {
      const input: ModelConfigSourcesInput = {
        env: {},
      };

      const result = resolveModelConfig(input);

      expect(result.config.authType).toBeUndefined();
      expect(result.config.model).toBe('llama3.2');
    });

    it('should not read auth env vars without authType', () => {
      const input: ModelConfigSourcesInput = {
        env: {
          OLLAMA_MODEL: 'should-not-be-used',
        },
      };

      const result = resolveModelConfig(input);

      // Should use default since authType is not set
      expect(result.config.model).toBe('llama3.2');
    });
  });
});

describe('ModelConfigCliInput type', () => {
  it('should accept valid input', () => {
    const input: ModelConfigCliInput = {
      model: 'test-model',
      apiKey: 'test-key',
      baseUrl: 'https://test.url',
    };

    expect(input.model).toBe('test-model');
  });
});

describe('ModelConfigSettingsInput type', () => {
  it('should accept valid input', () => {
    const input: ModelConfigSettingsInput = {
      model: 'test-model',
      apiKey: 'test-key',
      baseUrl: 'https://test.url',
      generationConfig: { timeout: 30000 },
    };

    expect(input.generationConfig?.timeout).toBe(30000);
  });
});
