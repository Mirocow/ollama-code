/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { promptIdContext } from './promptIdContext.js';

describe('promptIdContext', () => {
  it('should be an AsyncLocalStorage instance', () => {
    expect(promptIdContext).toBeDefined();
    expect(typeof promptIdContext.run).toBe('function');
    expect(typeof promptIdContext.getStore).toBe('function');
    expect(typeof promptIdContext.enterWith).toBe('function');
  });

  it('should store and retrieve values correctly', async () => {
    const testId = 'test-prompt-id-123';

    const result = await promptIdContext.run(testId, () => {
      return promptIdContext.getStore();
    });

    expect(result).toBe(testId);
  });

  it('should return undefined when no value is set', () => {
    expect(promptIdContext.getStore()).toBeUndefined();
  });

  it('should support nested runs with different values', async () => {
    const outerId = 'outer-id';
    const innerId = 'inner-id';

    await promptIdContext.run(outerId, async () => {
      expect(promptIdContext.getStore()).toBe(outerId);

      await promptIdContext.run(innerId, () => {
        expect(promptIdContext.getStore()).toBe(innerId);
      });

      expect(promptIdContext.getStore()).toBe(outerId);
    });
  });

  it('should support async operations within run', async () => {
    const testId = 'async-prompt-id';

    const result = await promptIdContext.run(testId, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return promptIdContext.getStore();
    });

    expect(result).toBe(testId);
  });

  it('should enter context with enterWith', () => {
    const testId = 'enter-with-id';

    promptIdContext.enterWith(testId);
    expect(promptIdContext.getStore()).toBe(testId);
  });
});
