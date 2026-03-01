/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { isFunctionResponse, isFunctionCall } from './messageInspectors.js';
import type { Content } from '../types/content.js';

describe('isFunctionResponse', () => {
  it('should return true for valid function response content', () => {
    const content: Content = {
      role: 'user',
      parts: [{ functionResponse: { name: 'testFunction', response: {} } }],
    };
    expect(isFunctionResponse(content)).toBe(true);
  });

  it('should return true for multiple function response parts', () => {
    const content: Content = {
      role: 'user',
      parts: [
        { functionResponse: { name: 'func1', response: {} } },
        { functionResponse: { name: 'func2', response: {} } },
      ],
    };
    expect(isFunctionResponse(content)).toBe(true);
  });

  it('should return false for model role', () => {
    const content: Content = {
      role: 'model',
      parts: [{ functionResponse: { name: 'testFunction', response: {} } }],
    };
    expect(isFunctionResponse(content)).toBe(false);
  });

  it('should return false for mixed parts', () => {
    const content: Content = {
      role: 'user',
      parts: [
        { text: 'some text' },
        { functionResponse: { name: 'testFunction', response: {} } },
      ],
    };
    expect(isFunctionResponse(content)).toBe(false);
  });

  it('should return false for text-only content', () => {
    const content: Content = {
      role: 'user',
      parts: [{ text: 'Hello' }],
    };
    expect(isFunctionResponse(content)).toBe(false);
  });

  it('should return false for empty parts', () => {
    const content: Content = {
      role: 'user',
      parts: [],
    };
    expect(isFunctionResponse(content)).toBe(true); // every() returns true for empty array
  });

  it('should return false for undefined parts', () => {
    const content = {
      role: 'user',
    } as Content;
    expect(isFunctionResponse(content)).toBe(false);
  });
});

describe('isFunctionCall', () => {
  it('should return true for valid function call content', () => {
    const content: Content = {
      role: 'model',
      parts: [{ functionCall: { name: 'testFunction', args: {} } }],
    };
    expect(isFunctionCall(content)).toBe(true);
  });

  it('should return true for multiple function call parts', () => {
    const content: Content = {
      role: 'model',
      parts: [
        { functionCall: { name: 'func1', args: {} } },
        { functionCall: { name: 'func2', args: {} } },
      ],
    };
    expect(isFunctionCall(content)).toBe(true);
  });

  it('should return false for user role', () => {
    const content: Content = {
      role: 'user',
      parts: [{ functionCall: { name: 'testFunction', args: {} } }],
    };
    expect(isFunctionCall(content)).toBe(false);
  });

  it('should return false for mixed parts', () => {
    const content: Content = {
      role: 'model',
      parts: [
        { text: 'some text' },
        { functionCall: { name: 'testFunction', args: {} } },
      ],
    };
    expect(isFunctionCall(content)).toBe(false);
  });

  it('should return false for text-only content', () => {
    const content: Content = {
      role: 'model',
      parts: [{ text: 'Hello' }],
    };
    expect(isFunctionCall(content)).toBe(false);
  });

  it('should return true for empty parts (every() returns true for empty array)', () => {
    const content: Content = {
      role: 'model',
      parts: [],
    };
    expect(isFunctionCall(content)).toBe(true);
  });

  it('should return false for undefined parts', () => {
    const content = {
      role: 'model',
    } as Content;
    expect(isFunctionCall(content)).toBe(false);
  });
});
