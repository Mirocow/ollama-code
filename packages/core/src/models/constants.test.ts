/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  MODEL_GENERATION_CONFIG_FIELDS,
  CREDENTIAL_FIELDS,
  PROVIDER_SOURCED_FIELDS,
  AUTH_ENV_MAPPINGS,
  DEFAULT_MODELS,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  OLLAMA_MODELS,
} from './constants.js';

describe('MODEL_GENERATION_CONFIG_FIELDS', () => {
  it('should contain expected fields', () => {
    expect(MODEL_GENERATION_CONFIG_FIELDS).toContain('samplingParams');
    expect(MODEL_GENERATION_CONFIG_FIELDS).toContain('timeout');
    expect(MODEL_GENERATION_CONFIG_FIELDS).toContain('maxRetries');
    expect(MODEL_GENERATION_CONFIG_FIELDS).toContain('schemaCompliance');
    expect(MODEL_GENERATION_CONFIG_FIELDS).toContain('reasoning');
    expect(MODEL_GENERATION_CONFIG_FIELDS).toContain('contextWindowSize');
    expect(MODEL_GENERATION_CONFIG_FIELDS).toContain('customHeaders');
    expect(MODEL_GENERATION_CONFIG_FIELDS).toContain('extra_body');
  });

  it('should be a readonly array', () => {
    expect(Array.isArray(MODEL_GENERATION_CONFIG_FIELDS)).toBe(true);
  });
});

describe('CREDENTIAL_FIELDS', () => {
  it('should contain expected fields', () => {
    expect(CREDENTIAL_FIELDS).toContain('model');
    expect(CREDENTIAL_FIELDS).toContain('apiKey');
    expect(CREDENTIAL_FIELDS).toContain('apiKeyEnvKey');
    expect(CREDENTIAL_FIELDS).toContain('baseUrl');
  });

  it('should be a readonly array', () => {
    expect(Array.isArray(CREDENTIAL_FIELDS)).toBe(true);
  });
});

describe('PROVIDER_SOURCED_FIELDS', () => {
  it('should contain all credential and generation config fields', () => {
    expect(PROVIDER_SOURCED_FIELDS).toContain('model');
    expect(PROVIDER_SOURCED_FIELDS).toContain('apiKey');
    expect(PROVIDER_SOURCED_FIELDS).toContain('samplingParams');
    expect(PROVIDER_SOURCED_FIELDS).toContain('timeout');
  });

  it('should be combination of CREDENTIAL_FIELDS and MODEL_GENERATION_CONFIG_FIELDS', () => {
    expect(PROVIDER_SOURCED_FIELDS.length).toBe(
      CREDENTIAL_FIELDS.length + MODEL_GENERATION_CONFIG_FIELDS.length,
    );
  });
});

describe('AUTH_ENV_MAPPINGS', () => {
  it('should have ollama mapping', () => {
    expect(AUTH_ENV_MAPPINGS.ollama).toBeDefined();
  });

  it('should have correct ollama env vars', () => {
    expect(AUTH_ENV_MAPPINGS.ollama.apiKey).toContain('OLLAMA_API_KEY');
    expect(AUTH_ENV_MAPPINGS.ollama.baseUrl).toContain('OLLAMA_BASE_URL');
    expect(AUTH_ENV_MAPPINGS.ollama.baseUrl).toContain('OLLAMA_HOST');
    expect(AUTH_ENV_MAPPINGS.ollama.model).toContain('OLLAMA_MODEL');
  });
});

describe('DEFAULT_MODELS', () => {
  it('should have ollama default', () => {
    expect(DEFAULT_MODELS.ollama).toBe('llama3.2');
  });
});

describe('DEFAULT_OLLAMA_MODEL', () => {
  it('should be llama3.2', () => {
    expect(DEFAULT_OLLAMA_MODEL).toBe('llama3.2');
  });
});

describe('DEFAULT_OLLAMA_EMBEDDING_MODEL', () => {
  it('should be nomic-embed-text', () => {
    expect(DEFAULT_OLLAMA_EMBEDDING_MODEL).toBe('nomic-embed-text');
  });
});

describe('OLLAMA_MODELS', () => {
  it('should be an array', () => {
    expect(Array.isArray(OLLAMA_MODELS)).toBe(true);
  });

  it('should contain llama models', () => {
    const llama32 = OLLAMA_MODELS.find((m) => m.id === 'llama3.2');
    expect(llama32).toBeDefined();
    expect(llama32?.name).toBe('Llama 3.2');
  });

  it('should contain deepseek models', () => {
    const deepseek = OLLAMA_MODELS.find((m) => m.id === 'deepseek-coder-v2');
    expect(deepseek).toBeDefined();
  });

  it('should contain mistral models', () => {
    const mistral = OLLAMA_MODELS.find((m) => m.id === 'mistral');
    expect(mistral).toBeDefined();
  });

  it('should contain phi models', () => {
    const phi3 = OLLAMA_MODELS.find((m) => m.id === 'phi3');
    expect(phi3).toBeDefined();
    const phi4 = OLLAMA_MODELS.find((m) => m.id === 'phi4');
    expect(phi4).toBeDefined();
  });

  it('should have id for each model', () => {
    for (const model of OLLAMA_MODELS) {
      expect(model.id).toBeDefined();
      expect(typeof model.id).toBe('string');
    }
  });

  it('should have name for each model', () => {
    for (const model of OLLAMA_MODELS) {
      expect(model.name).toBeDefined();
      expect(typeof model.name).toBe('string');
    }
  });

  it('should have description for each model', () => {
    for (const model of OLLAMA_MODELS) {
      expect(model.description).toBeDefined();
      expect(typeof model.description).toBe('string');
    }
  });
});
