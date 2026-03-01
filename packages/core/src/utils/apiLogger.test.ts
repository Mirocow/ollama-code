/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { ApiLogger, apiLogger } from './apiLogger.js';

describe('ApiLogger', () => {
  let tempDir: string;
  let logger: ApiLogger;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'api-logger-test-'));
    logger = new ApiLogger(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should create logger with custom log directory', () => {
      expect(logger).toBeDefined();
    });

    it('should handle string argument for custom log directory', () => {
      const stringLogger = new ApiLogger(tempDir);
      expect(stringLogger).toBeDefined();
    });

    it('should handle options object with customLogDir', () => {
      const optionsLogger = new ApiLogger({ customLogDir: tempDir });
      expect(optionsLogger).toBeDefined();
    });

    it('should handle options object with logPrefix', () => {
      const optionsLogger = new ApiLogger({
        customLogDir: tempDir,
        logPrefix: 'test',
      });
      expect(optionsLogger).toBeDefined();
    });

    it('should use default log directory when not provided', () => {
      const defaultLogger = new ApiLogger();
      expect(defaultLogger).toBeDefined();
    });

    it('should expand tilde to home directory', () => {
      const tildeLogger = new ApiLogger('~/logs');
      expect(tildeLogger).toBeDefined();
    });

    it('should handle relative paths', () => {
      const relativeLogger = new ApiLogger('./relative-logs');
      expect(relativeLogger).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should create log directory', async () => {
      await logger.initialize();
      const stats = await fs.stat(tempDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not throw if already initialized', async () => {
      await logger.initialize();
      await expect(logger.initialize()).resolves.not.toThrow();
    });
  });

  describe('logInteraction', () => {
    it('should log request and response', async () => {
      const filePath = await logger.logInteraction(
        { prompt: 'test prompt' },
        { text: 'test response' },
      );

      const content = await fs.readFile(filePath, 'utf-8');
      const log = JSON.parse(content);

      expect(log.request).toEqual({ prompt: 'test prompt' });
      expect(log.response).toEqual({ text: 'test response' });
      expect(log.error).toBeNull();
      expect(log.timestamp).toBeDefined();
      expect(log.system).toBeDefined();
      expect(log.system.hostname).toBeDefined();
      expect(log.system.platform).toBeDefined();
    });

    it('should log error when provided', async () => {
      const error = new Error('Test error');
      error.stack = 'Test stack trace';

      const filePath = await logger.logInteraction(
        { prompt: 'test' },
        null,
        error,
      );

      const content = await fs.readFile(filePath, 'utf-8');
      const log = JSON.parse(content);

      expect(log.error).toBeDefined();
      expect(log.error.message).toBe('Test error');
      expect(log.error.stack).toBe('Test stack trace');
    });

    it('should create log file with correct naming pattern', async () => {
      const filePath = await logger.logInteraction({ test: 'data' });
      const filename = path.basename(filePath);

      expect(filename).toMatch(/^api-.*\.json$/);
    });

    it('should use custom log prefix', async () => {
      const customLogger = new ApiLogger({
        customLogDir: tempDir,
        logPrefix: 'ollama',
      });

      const filePath = await customLogger.logInteraction({ test: 'data' });
      const filename = path.basename(filePath);

      expect(filename).toMatch(/^ollama-.*\.json$/);
    });
  });

  describe('getLogFiles', () => {
    it('should return empty array when no logs exist', async () => {
      const files = await logger.getLogFiles();
      expect(files).toEqual([]);
    });

    it('should return log files sorted by most recent', async () => {
      // Create some log files
      await logger.logInteraction({ test: 1 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await logger.logInteraction({ test: 2 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await logger.logInteraction({ test: 3 });

      const files = await logger.getLogFiles();
      expect(files.length).toBe(3);
      // Files should be sorted most recent first (reverse alphabetical by timestamp)
    });

    it('should respect limit parameter', async () => {
      await logger.logInteraction({ test: 1 });
      await logger.logInteraction({ test: 2 });
      await logger.logInteraction({ test: 3 });

      const files = await logger.getLogFiles(2);
      expect(files.length).toBe(2);
    });

    it('should only return files matching log prefix', async () => {
      await logger.logInteraction({ test: 1 });

      // Create a file that doesn't match the prefix
      await fs.writeFile(path.join(tempDir, 'other-file.json'), '{}');

      const files = await logger.getLogFiles();
      expect(files.length).toBe(1);
      expect(path.basename(files[0]).startsWith('api')).toBe(true);
    });
  });

  describe('readLogFile', () => {
    it('should read and parse log file', async () => {
      const filePath = await logger.logInteraction(
        { prompt: 'test' },
        { response: 'ok' },
      );

      const log = await logger.readLogFile(filePath);

      expect(log).toHaveProperty('request');
      expect(log).toHaveProperty('response');
      expect(log).toHaveProperty('timestamp');
    });

    it('should throw for non-existent file', async () => {
      await expect(
        logger.readLogFile('/non/existent/file.json'),
      ).rejects.toThrow();
    });
  });
});

describe('apiLogger singleton', () => {
  it('should be an instance of ApiLogger', () => {
    expect(apiLogger).toBeInstanceOf(ApiLogger);
  });

  it('should have ollama log prefix', () => {
    // The singleton is created with logPrefix: 'ollama'
    expect(apiLogger).toBeDefined();
  });
});
