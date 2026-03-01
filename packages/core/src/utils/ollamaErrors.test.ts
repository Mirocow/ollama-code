/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  OllamaApiError,
  OllamaConnectionError,
  OllamaModelNotFoundError,
  OllamaModelLoadError,
  OllamaGenerationError,
  OllamaTimeoutError,
  OllamaAbortError,
  OllamaInvalidResponseError,
  OllamaAuthenticationError,
  OllamaStreamingError,
  OllamaContextLengthError,
  OllamaResourceError,
  detectOllamaError,
  wrapOllamaError,
  getFriendlyOllamaErrorMessage,
} from './ollamaErrors.js';

describe('OllamaApiError', () => {
  it('should create error with message and code', () => {
    const error = new OllamaApiError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('OllamaApiError');
  });

  it('should include statusCode in toString', () => {
    const error = new OllamaApiError('Test error', 'TEST_CODE', 404);
    expect(error.toString()).toContain('HTTP 404');
  });

  it('should include details in toString', () => {
    const error = new OllamaApiError('Test error', 'TEST_CODE', undefined, { key: 'value' });
    expect(error.toString()).toContain('"key": "value"');
  });

  it('should return correct toJSON', () => {
    const error = new OllamaApiError('Test error', 'TEST_CODE', 404, { key: 'value' });
    const json = error.toJSON();
    expect(json).toEqual({
      name: 'OllamaApiError',
      code: 'TEST_CODE',
      statusCode: 404,
      message: 'Test error',
      details: { key: 'value' },
    });
  });
});

describe('OllamaConnectionError', () => {
  it('should create error with default message', () => {
    const error = new OllamaConnectionError();
    expect(error.message).toBe('Failed to connect to Ollama server');
    expect(error.code).toBe('CONNECTION_ERROR');
  });

  it('should create error with custom message and cause', () => {
    const cause = new Error('Original error');
    const error = new OllamaConnectionError('Custom message', cause);
    expect(error.message).toBe('Custom message');
    expect(error.cause).toBe(cause);
  });
});

describe('OllamaModelNotFoundError', () => {
  it('should create error with model name', () => {
    const error = new OllamaModelNotFoundError('llama2');
    expect(error.message).toContain('llama2');
    expect(error.message).toContain('not found');
    expect(error.code).toBe('MODEL_NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });
});

describe('OllamaModelLoadError', () => {
  it('should create error with model name only', () => {
    const error = new OllamaModelLoadError('llama2');
    expect(error.message).toContain('Failed to load model');
    expect(error.message).toContain('llama2');
    expect(error.code).toBe('MODEL_LOAD_ERROR');
  });

  it('should create error with model name and reason', () => {
    const error = new OllamaModelLoadError('llama2', 'Out of memory');
    expect(error.message).toContain('Out of memory');
  });
});

describe('OllamaGenerationError', () => {
  it('should create error with default message', () => {
    const error = new OllamaGenerationError();
    expect(error.message).toBe('Generation failed');
    expect(error.code).toBe('GENERATION_ERROR');
  });

  it('should create error with partial response', () => {
    const error = new OllamaGenerationError('Generation failed', 'Partial text...');
    expect(error.partialResponse).toBe('Partial text...');
  });
});

describe('OllamaTimeoutError', () => {
  it('should create error with timeout value', () => {
    const error = new OllamaTimeoutError(30000);
    expect(error.message).toContain('30000ms');
    expect(error.code).toBe('TIMEOUT_ERROR');
  });
});

describe('OllamaAbortError', () => {
  it('should create error with default message', () => {
    const error = new OllamaAbortError();
    expect(error.message).toBe('Request was aborted');
    expect(error.code).toBe('ABORT_ERROR');
  });

  it('should create error with reason', () => {
    const error = new OllamaAbortError('User cancelled');
    expect(error.message).toContain('User cancelled');
  });
});

describe('OllamaInvalidResponseError', () => {
  it('should create error with default message', () => {
    const error = new OllamaInvalidResponseError();
    expect(error.message).toBe('Invalid response from Ollama server');
    expect(error.code).toBe('INVALID_RESPONSE');
  });

  it('should create error with custom message and raw data', () => {
    const error = new OllamaInvalidResponseError('Invalid JSON', { raw: 'data' });
    expect(error.message).toBe('Invalid JSON');
    expect(error.rawData).toEqual({ raw: 'data' });
  });
});

describe('OllamaAuthenticationError', () => {
  it('should create error with default message', () => {
    const error = new OllamaAuthenticationError();
    expect(error.message).toBe('Authentication failed');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.statusCode).toBe(401);
  });

  it('should create error with custom message', () => {
    const error = new OllamaAuthenticationError('Invalid API key');
    expect(error.message).toBe('Invalid API key');
  });
});

describe('OllamaStreamingError', () => {
  it('should create error with default message', () => {
    const error = new OllamaStreamingError();
    expect(error.message).toBe('Streaming error');
    expect(error.code).toBe('STREAMING_ERROR');
  });

  it('should create error with last valid chunk', () => {
    const error = new OllamaStreamingError('Stream interrupted', { chunk: 'data' });
    expect(error.lastValidChunk).toEqual({ chunk: 'data' });
  });
});

describe('OllamaContextLengthError', () => {
  it('should create error with token counts', () => {
    const error = new OllamaContextLengthError(5000, 4096);
    expect(error.message).toContain('5000 tokens');
    expect(error.message).toContain('4096 max tokens');
    expect(error.code).toBe('CONTEXT_LENGTH_EXCEEDED');
    expect(error.statusCode).toBe(400);
    expect(error.tokenCount).toBe(5000);
    expect(error.maxTokens).toBe(4096);
  });
});

describe('OllamaResourceError', () => {
  it('should create error with default message', () => {
    const error = new OllamaResourceError();
    expect(error.message).toBe('Insufficient GPU/memory resources');
    expect(error.code).toBe('RESOURCE_ERROR');
  });

  it('should create error with memory values', () => {
    const error = new OllamaResourceError('Out of GPU memory', 8000, 4000);
    expect(error.requiredMemory).toBe(8000);
    expect(error.availableMemory).toBe(4000);
  });
});

describe('detectOllamaError', () => {
  it('should return existing OllamaApiError unchanged', () => {
    const error = new OllamaModelNotFoundError('llama2');
    const result = detectOllamaError(error);
    expect(result).toBe(error);
  });

  it('should detect AbortError', () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    const result = detectOllamaError(abortError);
    expect(result).toBeInstanceOf(OllamaAbortError);
  });

  it('should detect AbortError from code', () => {
    const abortError = { code: 'ABORT_ERR' } as NodeJS.ErrnoException;
    const result = detectOllamaError(abortError);
    expect(result).toBeInstanceOf(OllamaAbortError);
  });

  it('should detect model not found error', () => {
    const error = new Error('model "llama2" not found');
    const result = detectOllamaError(error, { modelName: 'llama2' });
    expect(result).toBeInstanceOf(OllamaModelNotFoundError);
  });

  it('should detect context length error', () => {
    const error = new Error('context length exceeded');
    const result = detectOllamaError(error);
    expect(result).toBeInstanceOf(OllamaContextLengthError);
  });

  it('should detect memory error', () => {
    const error = new Error('CUDA out of memory');
    const result = detectOllamaError(error);
    expect(result).toBeInstanceOf(OllamaResourceError);
  });

  it('should detect connection error', () => {
    const error = new Error('ECONNREFUSED');
    const result = detectOllamaError(error);
    expect(result).toBeInstanceOf(OllamaConnectionError);
  });

  it('should detect timeout error', () => {
    const error = new Error('timeout occurred');
    const result = detectOllamaError(error, { timeoutMs: 30000 });
    expect(result).toBeInstanceOf(OllamaTimeoutError);
  });

  it('should detect model load error', () => {
    const error = new Error('failed to load model');
    const result = detectOllamaError(error, { modelName: 'llama2' });
    expect(result).toBeInstanceOf(OllamaModelLoadError);
  });

  it('should return generic OllamaApiError for unknown errors', () => {
    const error = new Error('Unknown error');
    const result = detectOllamaError(error);
    expect(result).toBeInstanceOf(OllamaApiError);
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('should handle string errors', () => {
    const result = detectOllamaError('Some error string');
    expect(result).toBeInstanceOf(OllamaApiError);
  });
});

describe('wrapOllamaError', () => {
  it('should return OllamaApiError unchanged', () => {
    const error = new OllamaModelNotFoundError('llama2');
    const result = wrapOllamaError(error, 'loadModel');
    expect(result).toBe(error);
  });

  it('should wrap non-OllamaApiError with operation context', () => {
    const error = new Error('Something went wrong');
    const result = wrapOllamaError(error, 'loadModel', { model: 'llama2' });
    expect(result.message).toContain('loadModel');
    expect(result.details).toHaveProperty('model', 'llama2');
    expect(result.details).toHaveProperty('operation', 'loadModel');
  });
});

describe('getFriendlyOllamaErrorMessage', () => {
  it('should return friendly message for OllamaModelNotFoundError', () => {
    const error = new OllamaModelNotFoundError('llama2');
    expect(getFriendlyOllamaErrorMessage(error)).toContain('ollama pull');
  });

  it('should return friendly message for OllamaConnectionError', () => {
    const error = new OllamaConnectionError();
    expect(getFriendlyOllamaErrorMessage(error)).toContain('ollama serve');
  });

  it('should return friendly message for OllamaTimeoutError', () => {
    const error = new OllamaTimeoutError(30000);
    expect(getFriendlyOllamaErrorMessage(error)).toContain('timed out');
  });

  it('should return friendly message for OllamaContextLengthError', () => {
    const error = new OllamaContextLengthError(5000, 4096);
    expect(getFriendlyOllamaErrorMessage(error)).toContain('too long');
  });

  it('should return friendly message for OllamaResourceError', () => {
    const error = new OllamaResourceError();
    expect(getFriendlyOllamaErrorMessage(error)).toContain('GPU memory');
  });

  it('should return friendly message for OllamaAbortError', () => {
    const error = new OllamaAbortError();
    expect(getFriendlyOllamaErrorMessage(error)).toContain('cancelled');
  });

  it('should return message for OllamaApiError', () => {
    const error = new OllamaApiError('Custom error', 'CUSTOM');
    expect(getFriendlyOllamaErrorMessage(error)).toBe('Custom error');
  });

  it('should return message for standard Error', () => {
    const error = new Error('Standard error');
    expect(getFriendlyOllamaErrorMessage(error)).toBe('Standard error');
  });

  it('should return generic message for unknown error types', () => {
    expect(getFriendlyOllamaErrorMessage('string error')).toBe('An unexpected error occurred');
    expect(getFriendlyOllamaErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getFriendlyOllamaErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});
