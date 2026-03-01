/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  ChunkValidator,
  ChunkValidationError,
  type ChunkValidationConfig,
  type ValidatedChunk,
  type OllamaChatChunk,
  type OllamaGenerateChunk,
} from './chunkValidator.js';

describe('ChunkValidationError', () => {
  it('should create an error with code', () => {
    const error = new ChunkValidationError('Test error', 'INVALID_JSON');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ChunkValidationError');
    expect(error.code).toBe('INVALID_JSON');
  });

  it('should create an error with chunk and details', () => {
    const chunk = { test: 'data' };
    const details = { key: 'value' };
    const error = new ChunkValidationError('Test error', 'CHUNK_TOO_LARGE', chunk, details);
    expect(error.chunk).toBe(chunk);
    expect(error.details).toBe(details);
  });
});

describe('ChunkValidator', () => {
  describe('constructor', () => {
    it('should create validator with default config', () => {
      const validator = new ChunkValidator();
      const stats = validator.getStats();
      expect(stats.totalChunks).toBe(0);
      expect(stats.errorCount).toBe(0);
    });

    it('should merge custom config with defaults', () => {
      const validator = new ChunkValidator({
        maxChunkSize: 500,
        validateJson: false,
      });
      expect(validator).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should validate a valid object chunk', () => {
      const validator = new ChunkValidator();
      const chunk = { message: { content: 'Hello' } };
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(true);
      expect(result.chunk).toBeDefined();
      expect(result.chunk?.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid string JSON chunk', () => {
      const validator = new ChunkValidator();
      const chunk = JSON.stringify({ message: { content: 'Hello' } });
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(true);
      expect(result.chunk?.data).toEqual({ message: { content: 'Hello' } });
    });

    it('should reject chunk that is too large', () => {
      const validator = new ChunkValidator({ maxChunkSize: 10 });
      const chunk = { data: 'a'.repeat(100) };
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CHUNK_TOO_LARGE')).toBe(true);
    });

    it('should reject chunk that is too small', () => {
      const validator = new ChunkValidator({ minChunkSize: 100 });
      const chunk = { data: 'a' };
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CHUNK_TOO_SMALL')).toBe(true);
    });

    it('should reject invalid JSON string', () => {
      const validator = new ChunkValidator({ validateJson: true });
      const result = validator.validate('not valid json');
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_JSON')).toBe(true);
    });

    it('should skip JSON validation when disabled', () => {
      const validator = new ChunkValidator({ validateJson: false });
      const result = validator.validate('not valid json');
      
      expect(result.valid).toBe(true);
      expect(result.chunk?.data).toBe('not valid json');
    });

    it('should reject null data when JSON validation enabled', () => {
      const validator = new ChunkValidator({ validateJson: true });
      const result = validator.validate(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_JSON')).toBe(true);
    });

    it('should accept raw size parameter', () => {
      const validator = new ChunkValidator({ maxChunkSize: 10 });
      const chunk = { data: 'small' };
      const result = validator.validate(chunk, 1000);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CHUNK_TOO_LARGE')).toBe(true);
    });

    it('should detect error in chunk', () => {
      const validator = new ChunkValidator({ detectChunkErrors: true });
      const chunk = { error: 'Something went wrong' };
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CHUNK_ERROR')).toBe(true);
    });

    it('should detect done_reason error', () => {
      const validator = new ChunkValidator({ detectChunkErrors: true });
      const chunk = { done_reason: 'error' };
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CHUNK_ERROR')).toBe(true);
    });

    it('should warn on future timestamp', () => {
      const validator = new ChunkValidator({ validateTimestamps: true });
      const futureDate = new Date(Date.now() + 120000).toISOString();
      const chunk = { created_at: futureDate };
      const result = validator.validate(chunk);
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn on old timestamp', () => {
      const validator = new ChunkValidator({ 
        validateTimestamps: true,
        maxChunkAge: 1000,
      });
      const oldDate = new Date(Date.now() - 10000).toISOString();
      const chunk = { created_at: oldDate };
      const result = validator.validate(chunk);
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn on model mismatch', () => {
      const validator = new ChunkValidator({ validateModelConsistency: true });
      validator.validate({ model: 'model-a' });
      const chunk = { model: 'model-b' };
      const result = validator.validate(chunk);
      
      expect(result.warnings.some(w => w.includes('Model changed'))).toBe(true);
    });

    it('should validate required fields for chat chunks', () => {
      const validator = new ChunkValidator({
        validateRequiredFields: true,
        requiredFields: { chat: ['message'], generate: [], embedding: [] },
      });
      const chunk = { message: { content: 'test' } };
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(true);
    });

    it('should reject missing required fields for chat chunks', () => {
      const validator = new ChunkValidator({
        validateRequiredFields: true,
        requiredFields: { chat: ['required_field'], generate: [], embedding: [] },
      });
      const chunk = { message: { content: 'test' } };
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
    });

    it('should validate required fields for generate chunks', () => {
      const validator = new ChunkValidator({
        validateRequiredFields: true,
        requiredFields: { chat: [], generate: ['response'], embedding: [] },
      });
      const chunk = { response: 'test' };
      const result = validator.validate(chunk);
      
      expect(result.valid).toBe(true);
    });

    it('should run custom validators', () => {
      const customValidator = vi.fn((chunk) => {
        if (chunk['invalid']) {
          return new ChunkValidationError('Invalid chunk', 'CUSTOM_VALIDATION_FAILED');
        }
        return null;
      });
      
      const validator = new ChunkValidator({
        customValidators: [customValidator],
      });
      
      const result = validator.validate({ invalid: true });
      
      expect(customValidator).toHaveBeenCalled();
      expect(result.errors.some(e => e.code === 'CUSTOM_VALIDATION_FAILED')).toBe(true);
    });

    it('should increment sequence number for each chunk', () => {
      const validator = new ChunkValidator();
      
      const result1 = validator.validate({ data: 1 });
      const result2 = validator.validate({ data: 2 });
      const result3 = validator.validate({ data: 3 });
      
      expect(result1.chunk?.sequenceNumber).toBe(1);
      expect(result2.chunk?.sequenceNumber).toBe(2);
      expect(result3.chunk?.sequenceNumber).toBe(3);
    });

    it('should track processing time', () => {
      const validator = new ChunkValidator();
      const result = validator.validate({ data: 'test' });
      
      expect(result.chunk?.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should track chunk size', () => {
      const validator = new ChunkValidator();
      const result = validator.validate({ data: 'test' });
      
      expect(result.chunk?.size).toBeGreaterThan(0);
    });
  });

  describe('validateBatch', () => {
    it('should validate multiple chunks', () => {
      const validator = new ChunkValidator();
      const chunks = [
        { data: 'a' },
        { data: 'b' },
        { data: 'c' },
      ];
      
      const results = validator.validateBatch(chunks);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.valid)).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset validator state', () => {
      const validator = new ChunkValidator();
      validator.validate({ model: 'test' });
      validator.validate({ model: 'test2' });
      
      validator.reset();
      
      const stats = validator.getStats();
      expect(stats.totalChunks).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.lastModel).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return validator statistics', () => {
      const validator = new ChunkValidator();
      validator.validate({ model: 'model-a' });
      validator.validate({ model: 'model-b' });
      
      const stats = validator.getStats();
      
      expect(stats.totalChunks).toBe(2);
      expect(stats.lastModel).toBe('model-b');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const validator = new ChunkValidator();
      validator.updateConfig({ maxChunkSize: 50 });
      
      const result = validator.validate({ data: 'a'.repeat(100) });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'CHUNK_TOO_LARGE')).toBe(true);
    });
  });

  describe('maxValidationErrors', () => {
    it('should throw when max validation errors exceeded', () => {
      const validator = new ChunkValidator({ 
        maxValidationErrors: 2,
        detectChunkErrors: true,
      });
      
      // First two errors should not throw
      validator.validate({ error: 'err1' });
      validator.validate({ error: 'err2' });
      
      // Third should throw
      expect(() => validator.validate({ error: 'err3' })).toThrow(ChunkValidationError);
    });
  });

  describe('timestamp validation edge cases', () => {
    it('should handle numeric timestamps', () => {
      const validator = new ChunkValidator({ validateTimestamps: true });
      const timestamp = Date.now();
      const result = validator.validate({ created_at: timestamp });
      
      expect(result.valid).toBe(true);
    });

    it('should skip invalid timestamp types', () => {
      const validator = new ChunkValidator({ validateTimestamps: true });
      const result = validator.validate({ created_at: { invalid: true } });
      
      expect(result.valid).toBe(true);
    });

    it('should handle missing timestamp', () => {
      const validator = new ChunkValidator({ validateTimestamps: true });
      const result = validator.validate({ data: 'test' });
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('model consistency', () => {
    it('should not warn when model is missing', () => {
      const validator = new ChunkValidator({ validateModelConsistency: true });
      const result = validator.validate({ data: 'test' });
      
      expect(result.warnings).toHaveLength(0);
    });
  });
});
