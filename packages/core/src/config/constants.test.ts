/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  type FileFilteringOptions,
  DEFAULT_MEMORY_FILE_FILTERING_OPTIONS,
  DEFAULT_FILE_FILTERING_OPTIONS,
} from './constants.js';

describe('FileFilteringOptions', () => {
  it('should have required properties', () => {
    const options: FileFilteringOptions = {
      respectGitIgnore: true,
      respectOllamaCodeIgnore: true,
    };

    expect(options.respectGitIgnore).toBe(true);
    expect(options.respectOllamaCodeIgnore).toBe(true);
  });

  it('should allow different combinations', () => {
    const bothTrue: FileFilteringOptions = {
      respectGitIgnore: true,
      respectOllamaCodeIgnore: true,
    };
    expect(bothTrue.respectGitIgnore).toBe(true);
    expect(bothTrue.respectOllamaCodeIgnore).toBe(true);

    const bothFalse: FileFilteringOptions = {
      respectGitIgnore: false,
      respectOllamaCodeIgnore: false,
    };
    expect(bothFalse.respectGitIgnore).toBe(false);
    expect(bothFalse.respectOllamaCodeIgnore).toBe(false);

    const mixed: FileFilteringOptions = {
      respectGitIgnore: true,
      respectOllamaCodeIgnore: false,
    };
    expect(mixed.respectGitIgnore).toBe(true);
    expect(mixed.respectOllamaCodeIgnore).toBe(false);
  });
});

describe('DEFAULT_MEMORY_FILE_FILTERING_OPTIONS', () => {
  it('should be defined', () => {
    expect(DEFAULT_MEMORY_FILE_FILTERING_OPTIONS).toBeDefined();
  });

  it('should not respect git ignore', () => {
    expect(DEFAULT_MEMORY_FILE_FILTERING_OPTIONS.respectGitIgnore).toBe(false);
  });

  it('should respect ollama code ignore', () => {
    expect(DEFAULT_MEMORY_FILE_FILTERING_OPTIONS.respectOllamaCodeIgnore).toBe(true);
  });

  it('should match FileFilteringOptions type', () => {
    const options: FileFilteringOptions = DEFAULT_MEMORY_FILE_FILTERING_OPTIONS;
    expect(typeof options.respectGitIgnore).toBe('boolean');
    expect(typeof options.respectOllamaCodeIgnore).toBe('boolean');
  });
});

describe('DEFAULT_FILE_FILTERING_OPTIONS', () => {
  it('should be defined', () => {
    expect(DEFAULT_FILE_FILTERING_OPTIONS).toBeDefined();
  });

  it('should respect git ignore', () => {
    expect(DEFAULT_FILE_FILTERING_OPTIONS.respectGitIgnore).toBe(true);
  });

  it('should respect ollama code ignore', () => {
    expect(DEFAULT_FILE_FILTERING_OPTIONS.respectOllamaCodeIgnore).toBe(true);
  });

  it('should match FileFilteringOptions type', () => {
    const options: FileFilteringOptions = DEFAULT_FILE_FILTERING_OPTIONS;
    expect(typeof options.respectGitIgnore).toBe('boolean');
    expect(typeof options.respectOllamaCodeIgnore).toBe('boolean');
  });
});

describe('constants comparison', () => {
  it('should have different respectGitIgnore values', () => {
    expect(DEFAULT_MEMORY_FILE_FILTERING_OPTIONS.respectGitIgnore).toBe(false);
    expect(DEFAULT_FILE_FILTERING_OPTIONS.respectGitIgnore).toBe(true);
  });

  it('should have same respectOllamaCodeIgnore values', () => {
    expect(DEFAULT_MEMORY_FILE_FILTERING_OPTIONS.respectOllamaCodeIgnore).toBe(
      DEFAULT_FILE_FILTERING_OPTIONS.respectOllamaCodeIgnore,
    );
  });
});
