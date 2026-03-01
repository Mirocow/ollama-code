/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JsonFormatter } from './json-formatter.js';

describe('JsonFormatter', () => {
  let formatter: JsonFormatter;

  beforeEach(() => {
    formatter = new JsonFormatter();
  });

  describe('format', () => {
    it('should format empty response', () => {
      const result = formatter.format();
      expect(result).toBe('{}');
    });

    it('should format response only', () => {
      const result = formatter.format('Hello, world!');
      const parsed = JSON.parse(result);

      expect(parsed.response).toBe('Hello, world!');
      expect(parsed.error).toBeUndefined();
    });

    it('should format error only', () => {
      const result = formatter.format(undefined, {
        type: 'Error',
        message: 'Something went wrong',
      });
      const parsed = JSON.parse(result);

      expect(parsed.response).toBeUndefined();
      expect(parsed.error).toEqual({
        type: 'Error',
        message: 'Something went wrong',
      });
    });

    it('should format both response and error', () => {
      const result = formatter.format('Partial result', {
        type: 'Warning',
        message: 'Some warning',
      });
      const parsed = JSON.parse(result);

      expect(parsed.response).toBe('Partial result');
      expect(parsed.error).toEqual({
        type: 'Warning',
        message: 'Some warning',
      });
    });

    it('should strip ANSI codes from response', () => {
      const ansiString = '\x1b[32mSuccess\x1b[0m';
      const result = formatter.format(ansiString);
      const parsed = JSON.parse(result);

      expect(parsed.response).toBe('Success');
    });

    it('should strip complex ANSI codes', () => {
      const ansiString = '\x1b[1;31;42mError\x1b[0m';
      const result = formatter.format(ansiString);
      const parsed = JSON.parse(result);

      expect(parsed.response).toBe('Error');
    });

    it('should format with proper indentation', () => {
      const result = formatter.format('test');

      // Should have 2-space indentation
      expect(result).toContain('\n');
      expect(result).toContain('  "response"');
    });

    it('should handle empty string response', () => {
      const result = formatter.format('');
      const parsed = JSON.parse(result);

      expect(parsed.response).toBe('');
    });

    it('should handle multiline response', () => {
      const multilineResponse = 'Line 1\nLine 2\nLine 3';
      const result = formatter.format(multilineResponse);
      const parsed = JSON.parse(result);

      expect(parsed.response).toBe(multilineResponse);
    });

    it('should handle special characters in response', () => {
      const specialChars = 'Quote: "Hello", Tab:\t, Unicode: 🎉';
      const result = formatter.format(specialChars);
      const parsed = JSON.parse(result);

      expect(parsed.response).toBe(specialChars);
    });
  });

  describe('formatError', () => {
    it('should format Error object', () => {
      const error = new Error('Test error');
      const result = formatter.formatError(error);
      const parsed = JSON.parse(result);

      expect(parsed.error).toEqual({
        type: 'Error',
        message: 'Test error',
      });
      expect(parsed.response).toBeUndefined();
    });

    it('should format TypeError', () => {
      const error = new TypeError('Type mismatch');
      const result = formatter.formatError(error);
      const parsed = JSON.parse(result);

      expect(parsed.error).toEqual({
        type: 'TypeError',
        message: 'Type mismatch',
      });
    });

    it('should format RangeError', () => {
      const error = new RangeError('Out of range');
      const result = formatter.formatError(error);
      const parsed = JSON.parse(result);

      expect(parsed.error).toEqual({
        type: 'RangeError',
        message: 'Out of range',
      });
    });

    it('should format custom error class', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error occurred');
      const result = formatter.formatError(error);
      const parsed = JSON.parse(result);

      expect(parsed.error).toEqual({
        type: 'CustomError',
        message: 'Custom error occurred',
      });
    });

    it('should include error code when provided', () => {
      const error = new Error('Not found');
      const result = formatter.formatError(error, 'NOT_FOUND');
      const parsed = JSON.parse(result);

      expect(parsed.error).toEqual({
        type: 'Error',
        message: 'Not found',
        code: 'NOT_FOUND',
      });
    });

    it('should include numeric error code', () => {
      const error = new Error('Server error');
      const result = formatter.formatError(error, 500);
      const parsed = JSON.parse(result);

      expect(parsed.error).toEqual({
        type: 'Error',
        message: 'Server error',
        code: 500,
      });
    });

    it('should not include code when undefined', () => {
      const error = new Error('Test error');
      const result = formatter.formatError(error, undefined);
      const parsed = JSON.parse(result);

      expect(parsed.error).toEqual({
        type: 'Error',
        message: 'Test error',
      });
      expect(parsed.error).not.toHaveProperty('code');
    });

    it('should strip ANSI codes from error message', () => {
      const error = new Error('\x1b[31mRed error\x1b[0m');
      const result = formatter.formatError(error);
      const parsed = JSON.parse(result);

      expect(parsed.error?.message).toBe('Red error');
    });

    it('should handle error with empty message', () => {
      const error = new Error('');
      const result = formatter.formatError(error);
      const parsed = JSON.parse(result);

      expect(parsed.error).toEqual({
        type: 'Error',
        message: '',
      });
    });
  });

  describe('integration', () => {
    it('should produce valid JSON for all outputs', () => {
      const outputs = [
        formatter.format(),
        formatter.format('response'),
        formatter.format(undefined, { type: 'E', message: 'm' }),
        formatter.format('r', { type: 'E', message: 'm' }),
        formatter.formatError(new Error('e')),
        formatter.formatError(new Error('e'), 'CODE'),
      ];

      for (const output of outputs) {
        expect(() => JSON.parse(output)).not.toThrow();
      }
    });

    it('should produce consistent format for format and formatError', () => {
      const formatResult = JSON.parse(formatter.format('test'));
      const errorFormatResult = JSON.parse(
        formatter.formatError(new Error('test error')),
      );

      // Both should have the same structure
      expect(Object.keys(formatResult).sort()).toEqual(['response']);
      expect(Object.keys(errorFormatResult).sort()).toEqual(['error']);
    });
  });
});
