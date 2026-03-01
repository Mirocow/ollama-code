/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  getDefaultApiKeyEnvVar,
  getDefaultModelEnvVar,
  ModelConfigError,
  StrictMissingCredentialsError,
  StrictMissingModelIdError,
  MissingApiKeyError,
  MissingModelError,
  MissingBaseUrlError,
  MissingAnthropicBaseUrlEnvError,
} from './modelConfigErrors.js';

describe('getDefaultApiKeyEnvVar', () => {
  it('should return OPENAI_API_KEY for openai', () => {
    expect(getDefaultApiKeyEnvVar('openai')).toBe('OPENAI_API_KEY');
  });

  it('should return ANTHROPIC_API_KEY for anthropic', () => {
    expect(getDefaultApiKeyEnvVar('anthropic')).toBe('ANTHROPIC_API_KEY');
  });

  it('should return GEMINI_API_KEY for gemini', () => {
    expect(getDefaultApiKeyEnvVar('gemini')).toBe('GEMINI_API_KEY');
  });

  it('should return GOOGLE_API_KEY for vertex-ai', () => {
    expect(getDefaultApiKeyEnvVar('vertex-ai')).toBe('GOOGLE_API_KEY');
  });

  it('should return API_KEY for unknown authType', () => {
    expect(getDefaultApiKeyEnvVar('unknown')).toBe('API_KEY');
    expect(getDefaultApiKeyEnvVar(undefined)).toBe('API_KEY');
  });
});

describe('getDefaultModelEnvVar', () => {
  it('should return OPENAI_MODEL for openai', () => {
    expect(getDefaultModelEnvVar('openai')).toBe('OPENAI_MODEL');
  });

  it('should return ANTHROPIC_MODEL for anthropic', () => {
    expect(getDefaultModelEnvVar('anthropic')).toBe('ANTHROPIC_MODEL');
  });

  it('should return GEMINI_MODEL for gemini', () => {
    expect(getDefaultModelEnvVar('gemini')).toBe('GEMINI_MODEL');
  });

  it('should return GOOGLE_MODEL for vertex-ai', () => {
    expect(getDefaultModelEnvVar('vertex-ai')).toBe('GOOGLE_MODEL');
  });

  it('should return MODEL for unknown authType', () => {
    expect(getDefaultModelEnvVar('unknown')).toBe('MODEL');
    expect(getDefaultModelEnvVar(undefined)).toBe('MODEL');
  });
});

describe('ModelConfigError', () => {
  it('should be an instance of Error', () => {
    class TestError extends ModelConfigError {
      readonly code = 'TEST_ERROR';
      constructor() {
        super('Test error message');
      }
    }

    const error = new TestError();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ModelConfigError);
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
  });
});

describe('StrictMissingCredentialsError', () => {
  it('should create error with envKey', () => {
    const error = new StrictMissingCredentialsError(
      'openai',
      'gpt-4',
      'OPENAI_API_KEY',
    );

    expect(error.code).toBe('STRICT_MISSING_CREDENTIALS');
    expect(error.message).toContain('gpt-4');
    expect(error.message).toContain('OPENAI_API_KEY');
    expect(error.message).toContain('modelProviders.openai');
  });

  it('should create error without envKey', () => {
    const error = new StrictMissingCredentialsError('ollama', 'llama3', undefined);

    expect(error.message).toContain('llama3');
    expect(error.message).toContain('Configure modelProviders');
  });
});

describe('StrictMissingModelIdError', () => {
  it('should create error with authType', () => {
    const error = new StrictMissingModelIdError('openai');

    expect(error.code).toBe('STRICT_MISSING_MODEL_ID');
    expect(error.message).toContain('openai');
    expect(error.message).toContain('Missing model id');
  });
});

describe('MissingApiKeyError', () => {
  it('should create error with all params', () => {
    const error = new MissingApiKeyError({
      authType: 'openai',
      model: 'gpt-4',
      baseUrl: 'https://api.openai.com',
      envKey: 'OPENAI_API_KEY',
    });

    expect(error.code).toBe('MISSING_API_KEY');
    expect(error.message).toContain('openai');
    expect(error.message).toContain('gpt-4');
    expect(error.message).toContain('OPENAI_API_KEY');
  });

  it('should handle undefined values', () => {
    const error = new MissingApiKeyError({
      authType: undefined,
      model: undefined,
      baseUrl: undefined,
      envKey: 'API_KEY',
    });

    expect(error.message).toContain('(unknown)');
    expect(error.message).toContain('(default)');
  });
});

describe('MissingModelError', () => {
  it('should create error with authType', () => {
    const error = new MissingModelError({
      authType: 'anthropic',
      envKey: 'ANTHROPIC_MODEL',
    });

    expect(error.code).toBe('MISSING_MODEL');
    expect(error.message).toContain('anthropic');
    expect(error.message).toContain('ANTHROPIC_MODEL');
  });
});

describe('MissingBaseUrlError', () => {
  it('should create error with model info', () => {
    const error = new MissingBaseUrlError({
      authType: 'openai',
      model: 'gpt-4',
    });

    expect(error.code).toBe('MISSING_BASE_URL');
    expect(error.message).toContain('gpt-4');
    expect(error.message).toContain('modelProviders.openai');
  });

  it('should handle undefined values', () => {
    const error = new MissingBaseUrlError({
      authType: undefined,
      model: undefined,
    });

    expect(error.message).toContain('(unknown)');
  });
});

describe('MissingAnthropicBaseUrlEnvError', () => {
  it('should create error', () => {
    const error = new MissingAnthropicBaseUrlEnvError();

    expect(error.code).toBe('MISSING_ANTHROPIC_BASE_URL_ENV');
    expect(error.message).toContain('ANTHROPIC_BASE_URL');
  });
});
