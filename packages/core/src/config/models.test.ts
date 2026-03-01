/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
} from './models.js';

describe('models constants', () => {
  describe('DEFAULT_OLLAMA_MODEL', () => {
    it('should be defined', () => {
      expect(DEFAULT_OLLAMA_MODEL).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_OLLAMA_MODEL).toBe('string');
    });

    it('should have expected value', () => {
      expect(DEFAULT_OLLAMA_MODEL).toBe('llama3.2');
    });

    it('should be non-empty', () => {
      expect(DEFAULT_OLLAMA_MODEL.length).toBeGreaterThan(0);
    });

    it('should be a valid model name format', () => {
      // Model names typically don't have spaces and use alphanumeric with optional dots/dashes
      expect(DEFAULT_OLLAMA_MODEL).toMatch(/^[a-z0-9][a-z0-9.\-_]*$/i);
    });
  });

  describe('DEFAULT_OLLAMA_EMBEDDING_MODEL', () => {
    it('should be defined', () => {
      expect(DEFAULT_OLLAMA_EMBEDDING_MODEL).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_OLLAMA_EMBEDDING_MODEL).toBe('string');
    });

    it('should have expected value', () => {
      expect(DEFAULT_OLLAMA_EMBEDDING_MODEL).toBe('nomic-embed-text');
    });

    it('should be non-empty', () => {
      expect(DEFAULT_OLLAMA_EMBEDDING_MODEL.length).toBeGreaterThan(0);
    });

    it('should be a valid model name format', () => {
      expect(DEFAULT_OLLAMA_EMBEDDING_MODEL).toMatch(/^[a-z0-9][a-z0-9.\-_]*$/i);
    });
  });

  describe('model constants comparison', () => {
    it('should be different models', () => {
      expect(DEFAULT_OLLAMA_MODEL).not.toBe(DEFAULT_OLLAMA_EMBEDDING_MODEL);
    });

    it('should both be valid Ollama model names', () => {
      const allModels = [DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_EMBEDDING_MODEL];
      allModels.forEach((model) => {
        expect(model.length).toBeGreaterThan(0);
        expect(typeof model).toBe('string');
      });
    });
  });
});
