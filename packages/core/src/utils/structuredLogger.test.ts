/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  StructuredLogger,
  withCorrelationId,
  getCorrelationId,
  generateCorrelationId,
} from './structuredLogger.js';

describe('StructuredLogger', () => {
  let outputMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    outputMock = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic logging', () => {
    it('should log debug messages', () => {
      const logger = new StructuredLogger({ output: outputMock });
      logger.debug('TestModule', 'Test message', { key: 'value' });

      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = outputMock.mock.calls[0][0];
      expect(entry.level).toBe('debug');
      expect(entry.module).toBe('TestModule');
      expect(entry.message).toBe('Test message');
      expect(entry.data).toEqual({ key: 'value' });
      expect(entry.timestamp).toBeDefined();
    });

    it('should log info messages', () => {
      const logger = new StructuredLogger({ output: outputMock });
      logger.info('TestModule', 'Info message');

      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = outputMock.mock.calls[0][0];
      expect(entry.level).toBe('info');
    });

    it('should log warn messages', () => {
      const logger = new StructuredLogger({ output: outputMock });
      logger.warn('TestModule', 'Warning message');

      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = outputMock.mock.calls[0][0];
      expect(entry.level).toBe('warn');
    });

    it('should log error messages with Error object', () => {
      const logger = new StructuredLogger({ output: outputMock });
      const error = new Error('Test error');
      logger.error('TestModule', 'Error occurred', error);

      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = outputMock.mock.calls[0][0];
      expect(entry.level).toBe('error');
      expect(entry.error).toBeDefined();
      expect(entry.error?.name).toBe('Error');
      expect(entry.error?.message).toBe('Test error');
    });
  });

  describe('minimum level', () => {
    it('should filter messages below minimum level', () => {
      const logger = new StructuredLogger({
        minLevel: 'warn',
        output: outputMock,
      });

      logger.debug('TestModule', 'Debug message');
      logger.info('TestModule', 'Info message');
      logger.warn('TestModule', 'Warn message');
      logger.error('TestModule', 'Error message');

      expect(outputMock).toHaveBeenCalledTimes(2); // warn and error only
    });
  });

  describe('correlation ID', () => {
    it('should include correlation ID from async context', () => {
      const logger = new StructuredLogger({ output: outputMock });

      withCorrelationId('test-correlation-123', () => {
        logger.info('TestModule', 'Message with correlation');
      });

      const entry = outputMock.mock.calls[0][0];
      expect(entry.correlationId).toBe('test-correlation-123');
    });

    it('should not include correlation ID when not in context', () => {
      const logger = new StructuredLogger({ output: outputMock });
      logger.info('TestModule', 'Message without correlation');

      const entry = outputMock.mock.calls[0][0];
      expect(entry.correlationId).toBeUndefined();
    });
  });

  describe('timing', () => {
    it('should time synchronous operations', async () => {
      const logger = new StructuredLogger({ output: outputMock });
      const result = await logger.time('TestModule', 'sync-op', () => 42);

      expect(result).toBe(42);
      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = outputMock.mock.calls[0][0];
      expect(entry.duration).toBeDefined();
      expect(entry.duration).toBeGreaterThanOrEqual(0);
    });

    it('should time async operations', async () => {
      const logger = new StructuredLogger({ output: outputMock });
      const result = await logger.time('TestModule', 'async-op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');
      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = outputMock.mock.calls[0][0];
      expect(entry.duration).toBeGreaterThanOrEqual(10);
    });

    it('should log errors with duration on failure', async () => {
      const logger = new StructuredLogger({ output: outputMock });

      await expect(
        logger.time('TestModule', 'failing-op', () => {
          throw new Error('Operation failed');
        }),
      ).rejects.toThrow('Operation failed');

      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = outputMock.mock.calls[0][0];
      expect(entry.level).toBe('error');
      expect(entry.duration).toBeDefined();
    });
  });

  describe('module logger', () => {
    it('should create module-scoped logger', () => {
      const logger = new StructuredLogger({ output: outputMock });
      const moduleLogger = logger.module('MyModule');

      moduleLogger.info('Module message');
      moduleLogger.warn('Module warning');

      expect(outputMock).toHaveBeenCalledTimes(2);
      expect(outputMock.mock.calls[0][0].module).toBe('MyModule');
      expect(outputMock.mock.calls[1][0].module).toBe('MyModule');
    });
  });

  describe('generateCorrelationId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('getCorrelationId', () => {
    it('should return undefined outside context', () => {
      expect(getCorrelationId()).toBeUndefined();
    });

    it('should return correlation ID inside context', () => {
      withCorrelationId('my-id', () => {
        expect(getCorrelationId()).toBe('my-id');
      });
    });
  });
});
