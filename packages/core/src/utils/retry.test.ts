/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  retryWithBackoff,
  getErrorStatus,
  type RetryOptions,
} from './retry.js';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw immediately if maxAttempts is 0', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    await expect(retryWithBackoff(fn, { maxAttempts: 0 })).rejects.toThrow(
      'maxAttempts must be a positive number.',
    );
  });

  it('should throw immediately if maxAttempts is negative', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    await expect(retryWithBackoff(fn, { maxAttempts: -1 })).rejects.toThrow(
      'maxAttempts must be a positive number.',
    );
  });

  it('should retry on 429 errors', async () => {
    const error429 = new Error('Too Many Requests') as Error & {
      status: number;
    };
    error429.status = 429;

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
    });

    // Advance timers for the retry delay
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on 5xx errors', async () => {
    const error500 = new Error('Internal Server Error') as Error & {
      status: number;
    };
    error500.status = 500;

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error500)
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 4xx errors (except 429)', async () => {
    const error400 = new Error('Bad Request') as Error & { status: number };
    error400.status = 400;

    const fn = vi.fn().mockRejectedValue(error400);

    await expect(
      retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
      }),
    ).rejects.toThrow('Bad Request');

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should exhaust retries and throw the last error', async () => {
    const error500 = new Error('Internal Server Error') as Error & {
      status: number;
    };
    error500.status = 500;

    const fn = vi.fn().mockRejectedValue(error500);

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
    });

    // Advance through all retry delays
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);

    await expect(promise).rejects.toThrow('Internal Server Error');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use custom shouldRetryOnError', async () => {
    const customError = new Error('Custom error');

    const fn = vi
      .fn()
      .mockRejectedValueOnce(customError)
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      shouldRetryOnError: () => true,
    });

    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use shouldRetryOnContent to retry on specific content', async () => {
    const response = { candidates: [{ content: { parts: [{ text: 'retry' }] } }] };

    const fn = vi
      .fn()
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce({ candidates: [{ content: { parts: [{ text: 'success' }] } }] });

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      shouldRetryOnContent: (content) => {
        const text = content.candidates?.[0]?.content?.parts?.[0]?.text;
        return text === 'retry';
      },
    });

    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toEqual({ candidates: [{ content: { parts: [{ text: 'success' }] } }] });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect Retry-After header', async () => {
    const error429 = new Error('Too Many Requests') as Error & {
      status: number;
      response: { headers: { 'retry-after': string } };
    };
    error429.status = 429;
    error429.response = { headers: { 'retry-after': '2' } };

    const fn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
    });

    // Advance by the Retry-After delay (2 seconds)
    await vi.advanceTimersByTimeAsync(2000);

    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should handle null options', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, undefined);
    expect(result).toBe('success');
  });

  it('should handle options with null values', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelayMs: null as unknown as number,
      maxDelayMs: null as unknown as number,
      shouldRetryOnError: null as unknown as () => boolean,
    });
    expect(result).toBe('success');
  });
});

describe('getErrorStatus', () => {
  it('should return undefined for non-object error', () => {
    expect(getErrorStatus('error string')).toBeUndefined();
    expect(getErrorStatus(123)).toBeUndefined();
    expect(getErrorStatus(null)).toBeUndefined();
    expect(getErrorStatus(undefined)).toBeUndefined();
  });

  it('should extract status from error.status', () => {
    const error = { status: 404 };
    expect(getErrorStatus(error)).toBe(404);
  });

  it('should extract status from error.statusCode', () => {
    const error = { statusCode: 500 };
    expect(getErrorStatus(error)).toBe(500);
  });

  it('should extract status from error.response.status', () => {
    const error = { response: { status: 403 } };
    expect(getErrorStatus(error)).toBe(403);
  });

  it('should extract status from error.error.code', () => {
    const error = { error: { code: 401 } };
    expect(getErrorStatus(error)).toBe(401);
  });

  it('should prioritize error.status over other properties', () => {
    const error = { status: 429, statusCode: 500, response: { status: 404 } };
    expect(getErrorStatus(error)).toBe(429);
  });

  it('should return undefined for invalid status codes', () => {
    expect(getErrorStatus({ status: 99 })).toBeUndefined();
    expect(getErrorStatus({ status: 600 })).toBeUndefined();
    expect(getErrorStatus({ status: 'invalid' })).toBeUndefined();
  });

  it('should return undefined for valid HTTP status codes', () => {
    expect(getErrorStatus({ status: 100 })).toBe(100);
    expect(getErrorStatus({ status: 200 })).toBe(200);
    expect(getErrorStatus({ status: 599 })).toBe(599);
  });
});
