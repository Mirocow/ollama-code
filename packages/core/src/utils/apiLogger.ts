/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import { createDebugLogger } from './debugLogger.js';

const debugLogger = createDebugLogger('API_LOGGER');

/**
 * Logger options type
 */
export interface ApiLoggerOptions {
  customLogDir?: string;
  logPrefix?: string;
}

/**
 * Logger for API requests and responses.
 * Used for debugging Ollama API interactions.
 */
export class ApiLogger {
  private logDir: string;
  private initialized: boolean = false;
  private logPrefix: string;

  /**
   * Creates a new API logger
   * @param customLogDirOrOptions - Custom log directory path or options object
   * Supports:
   * - Absolute paths
   * - Relative paths (resolved relative to current working directory)
   * - ~ expansion to home directory
   */
  constructor(customLogDirOrOptions?: string | ApiLoggerOptions) {
    let customLogDir: string | undefined;
    let logPrefix = 'api';
    
    // Handle both string and object argument
    if (typeof customLogDirOrOptions === 'string') {
      customLogDir = customLogDirOrOptions;
    } else if (customLogDirOrOptions) {
      customLogDir = customLogDirOrOptions.customLogDir;
      if (customLogDirOrOptions.logPrefix) {
        logPrefix = customLogDirOrOptions.logPrefix;
      }
    }
    
    this.logPrefix = logPrefix;
    
    if (customLogDir) {
      // Resolve relative paths to absolute paths
      // Handle ~ expansion
      let resolvedPath = customLogDir;
      if (customLogDir === '~' || customLogDir.startsWith('~/')) {
        resolvedPath = path.join(os.homedir(), customLogDir.slice(1));
      } else if (!path.isAbsolute(customLogDir)) {
        // If it's a relative path, resolve it relative to current working directory
        resolvedPath = path.resolve(process.cwd(), customLogDir);
      }
      this.logDir = path.normalize(resolvedPath);
    } else {
      this.logDir = path.join(process.cwd(), 'logs', 'ollama');
    }
  }

  /**
   * Initialize the logger by creating the log directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.logDir, { recursive: true });
      this.initialized = true;
    } catch (error) {
      debugLogger.error('Failed to initialize API logger:', error);
      throw new Error(`Failed to initialize API logger: ${error}`);
    }
  }

  /**
   * Logs an API request and its response
   * @param request The request sent to the API
   * @param response The response received from the API
   * @param error Optional error if the request failed
   * @returns The file path where the log was written
   */
  async logInteraction(
    request: unknown,
    response?: unknown,
    error?: Error,
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const id = uuidv4().slice(0, 8);
    const filename = `${this.logPrefix}-${timestamp}-${id}.json`;
    const filePath = path.join(this.logDir, filename);

    const logData = {
      timestamp: new Date().toISOString(),
      request,
      response: response || null,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : null,
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        nodeVersion: process.version,
      },
    };

    try {
      await fs.writeFile(filePath, JSON.stringify(logData, null, 2), 'utf-8');
      return filePath;
    } catch (writeError) {
      debugLogger.error('Failed to write API log file:', writeError);
      throw new Error(`Failed to write API log file: ${writeError}`);
    }
  }

  /**
   * Get all logged interactions
   * @param limit Optional limit on the number of log files to return (sorted by most recent first)
   * @returns Array of log file paths
   */
  async getLogFiles(limit?: number): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter((file) => file.startsWith(this.logPrefix) && file.endsWith('.json'))
        .map((file) => path.join(this.logDir, file))
        .sort()
        .reverse();

      return limit ? logFiles.slice(0, limit) : logFiles;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      debugLogger.error('Failed to read API log directory:', error);
      return [];
    }
  }

  /**
   * Read a specific log file
   * @param filePath The path to the log file
   * @returns The log file content
   */
  async readLogFile(filePath: string): Promise<unknown> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      debugLogger.error(`Failed to read log file ${filePath}:`, error);
      throw new Error(`Failed to read log file: ${error}`);
    }
  }
}

// Create singleton instance for easy import
export const apiLogger = new ApiLogger({ logPrefix: 'ollama' });
