/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { parseAndFormatApiError } from './errorParsing.js';

describe('parseAndFormatApiError', () => {
  describe('structured errors', () => {
    it('should format structured errors with message', () => {
      const error = { message: 'Something went wrong', status: 500 };
      const result = parseAndFormatApiError(error);
      expect(result).toBe('[API Error: Something went wrong]');
    });

    it('should add rate limit message for 429 errors', () => {
      const error = { message: 'Rate limit exceeded', status: 429 };
      const result = parseAndFormatApiError(error);
      expect(result).toContain('[API Error: Rate limit exceeded]');
      expect(result).toContain(
        'Possible quota limitations in place or slow response times detected',
      );
    });
  });

  describe('string errors', () => {
    it('should return simple string errors as is', () => {
      const result = parseAndFormatApiError('Simple error message');
      expect(result).toBe('[API Error: Simple error message]');
    });

    it('should parse JSON error from string', () => {
      const error = JSON.stringify({
        error: {
          message: 'API Error Message',
          code: 400,
          status: 'BAD_REQUEST',
        },
      });
      const result = parseAndFormatApiError(error);
      expect(result).toBe('[API Error: API Error Message (Status: 400)]');
    });

    it('should parse nested JSON error from string', () => {
      const nestedError = JSON.stringify({
        error: {
          message: 'Nested Error',
          code: 500,
          status: 'INTERNAL_ERROR',
        },
      });
      const error = JSON.stringify({
        error: {
          message: nestedError,
          code: 400,
          status: 'BAD_REQUEST',
        },
      });
      const result = parseAndFormatApiError(error);
      expect(result).toBe('[API Error: Nested Error (Status: 500)]');
    });

    it('should add rate limit message for 429 code in JSON', () => {
      const error = JSON.stringify({
        error: {
          message: 'Too many requests',
          code: 429,
          status: 'RATE_LIMITED',
        },
      });
      const result = parseAndFormatApiError(error);
      expect(result).toContain(
        'Possible quota limitations in place or slow response times detected',
      );
    });

    it('should handle string with JSON embedded', () => {
      const error = `Some prefix text {"error":{"message":"Embedded error","code":404,"status":"NOT_FOUND"}}`;
      const result = parseAndFormatApiError(error);
      expect(result).toBe('[API Error: Embedded error (Status: 404)]');
    });

    it('should handle invalid JSON in string', () => {
      const error = 'Error: {invalid json}';
      const result = parseAndFormatApiError(error);
      expect(result).toBe('[API Error: Error: {invalid json}]');
    });

    it('should handle string without JSON', () => {
      const error = 'No JSON here';
      const result = parseAndFormatApiError(error);
      expect(result).toBe('[API Error: No JSON here]');
    });

    it('should handle JSON that does not match API error format', () => {
      const error = '{"someOther":"format"}';
      const result = parseAndFormatApiError(error);
      expect(result).toBe('[API Error: {"someOther":"format"}]');
    });

    it('should handle JSON without status', () => {
      const error = JSON.stringify({
        error: {
          message: 'Error without status',
          code: 400,
        },
      });
      const result = parseAndFormatApiError(error);
      expect(result).toBe('[API Error: Error without status]');
    });
  });

  describe('unknown error types', () => {
    it('should handle null errors', () => {
      const result = parseAndFormatApiError(null);
      expect(result).toBe('[API Error: An unknown error occurred.]');
    });

    it('should handle undefined errors', () => {
      const result = parseAndFormatApiError(undefined);
      expect(result).toBe('[API Error: An unknown error occurred.]');
    });

    it('should handle number errors', () => {
      const result = parseAndFormatApiError(123);
      expect(result).toBe('[API Error: An unknown error occurred.]');
    });

    it('should handle object errors without message', () => {
      const result = parseAndFormatApiError({ foo: 'bar' });
      expect(result).toBe('[API Error: An unknown error occurred.]');
    });
  });
});
