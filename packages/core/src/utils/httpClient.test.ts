/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  createHttpClient,
  getDefaultHttpClient,
  resetDefaultHttpClient,
  shouldRetry,
  calculateRetryDelay,
} from './httpClient.js';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    request: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('httpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDefaultHttpClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createHttpClient', () => {
    it('should create axios instance with default config', () => {
      const client = createHttpClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(client.interceptors.request.use).toBeDefined();
      expect(client.interceptors.response.use).toBeDefined();
    });

    it('should create axios instance with custom config', () => {
      createHttpClient({
        baseURL: 'http://custom.url',
        timeout: 60000,
        apiKey: 'test-key',
        headers: { 'X-Custom': 'value' },
      });

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://custom.url',
          timeout: 60000,
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom': 'value',
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('should not add Authorization header if no apiKey', () => {
      createHttpClient({ baseURL: 'http://test.url' });

      const call = (axios.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.headers.Authorization).toBeUndefined();
    });
  });

  describe('getDefaultHttpClient', () => {
    it('should return singleton client', () => {
      const client1 = getDefaultHttpClient();
      const client2 = getDefaultHttpClient();

      expect(client1).toBe(client2);
    });

    it('should create new client with custom baseURL', () => {
      const client1 = getDefaultHttpClient();
      const client2 = getDefaultHttpClient('http://new.url');

      expect(axios.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetDefaultHttpClient', () => {
    it('should reset singleton client', () => {
      const client1 = getDefaultHttpClient();
      resetDefaultHttpClient();
      const client2 = getDefaultHttpClient();

      expect(axios.create).toHaveBeenCalledTimes(2);
    });
  });
});

describe('shouldRetry', () => {
  const createMockConfig = (retryCount = 0): InternalAxiosRequestConfig & { _retryCount?: number } => ({
    _retryCount: retryCount,
  } as unknown as InternalAxiosRequestConfig & { _retryCount?: number });

  const createMockError = (status?: number): AxiosError => {
    return {
      response: status ? { status, headers: {} } : undefined,
    } as AxiosError;
  };

  it('should not retry if max retries exceeded', () => {
    const config = createMockConfig(3);
    const error = createMockError(500);

    expect(shouldRetry(error as AxiosError, config, 3)).toBe(false);
  });

  it('should retry on network error (no response)', () => {
    const config = createMockConfig(0);
    const error = createMockError();

    expect(shouldRetry(error as AxiosError, config, 3)).toBe(true);
  });

  it('should retry on 500 status', () => {
    const config = createMockConfig(0);
    const error = createMockError(500);

    expect(shouldRetry(error as AxiosError, config, 3)).toBe(true);
  });

  it('should retry on 429 status', () => {
    const config = createMockConfig(0);
    const error = createMockError(429);

    expect(shouldRetry(error as AxiosError, config, 3)).toBe(true);
  });

  it('should not retry on 400 status', () => {
    const config = createMockConfig(0);
    const error = createMockError(400);

    expect(shouldRetry(error as AxiosError, config, 3)).toBe(false);
  });
});

describe('calculateRetryDelay', () => {
  it('should use exponential backoff', () => {
    const delay1 = calculateRetryDelay(1000, 1);
    const delay2 = calculateRetryDelay(1000, 2);
    const delay3 = calculateRetryDelay(1000, 3);

    // delay1: ~1000ms (with jitter)
    expect(delay1).toBeGreaterThanOrEqual(900);
    expect(delay1).toBeLessThanOrEqual(1100);

    // delay2: ~2000ms (with jitter)
    expect(delay2).toBeGreaterThanOrEqual(1800);
    expect(delay2).toBeLessThanOrEqual(2200);

    // delay3: ~4000ms (with jitter)
    expect(delay3).toBeGreaterThanOrEqual(3600);
    expect(delay3).toBeLessThanOrEqual(4400);
  });

  it('should use Retry-After header when present', () => {
    const delay = calculateRetryDelay(1000, 1, '5');

    // 5 seconds = 5000ms
    expect(delay).toBe(5000);
  });

  it('should cap at maximum delay', () => {
    const delay = calculateRetryDelay(1000, 10);

    // Should be capped at 30000ms
    expect(delay).toBeLessThanOrEqual(30000);
  });
});
