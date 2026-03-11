/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extension Logger
 *
 * Provides structured logging for extensions with support for
 * log levels, file output, and log rotation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createDebugLogger } from '../utils/debugLogger.js';
import type {
  ExtensionLogLevel,
  ExtensionLogEntry,
  ExtensionLoggerInterface,
} from './extension-types.js';

const debugLogger = createDebugLogger('EXTENSION_LOGGER');

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for extension logging.
 */
export interface ExtensionLoggerConfig {
  /** Log level threshold */
  logLevel: ExtensionLogLevel;

  /** Whether to write logs to file */
  enableFileLogging: boolean;

  /** Maximum log file size in bytes before rotation */
  maxFileSize: number;

  /** Maximum number of rotated log files to keep */
  maxLogFiles: number;

  /** Directory for log files */
  logDirectory?: string;

  /** Whether to include timestamps */
  includeTimestamps: boolean;

  /** Whether to include stack traces in error logs */
  includeStackTrace: boolean;
}

const DEFAULT_CONFIG: ExtensionLoggerConfig = {
  logLevel: 'info',
  enableFileLogging: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 5,
  includeTimestamps: true,
  includeStackTrace: true,
};

// ============================================================================
// Extension Logger Implementation
// ============================================================================

/**
 * Logger implementation for a single extension.
 */
export class ExtensionLogger implements ExtensionLoggerInterface {
  private readonly extensionId: string;
  private readonly extensionName: string;
  private readonly config: ExtensionLoggerConfig;
  private readonly logs: ExtensionLogEntry[] = [];
  private readonly logFilePath: string;
  private currentLogSize: number = 0;

  constructor(
    extensionId: string,
    extensionName: string,
    config: Partial<ExtensionLoggerConfig> = {},
  ) {
    this.extensionId = extensionId;
    this.extensionName = extensionName;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Set up log file path
    const logDir = this.config.logDirectory ?? this.getDefaultLogDirectory();
    this.logFilePath = path.join(
      logDir,
      `${this.sanitizeName(extensionName)}.log`,
    );

    // Ensure log directory exists
    if (this.config.enableFileLogging) {
      this.ensureLogDirectory(logDir);
      this.initializeLogFile();
    }
  }

  // Public API

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, undefined, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, undefined, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, undefined, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, error, data);
  }

  getLogs(): ExtensionLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs.length = 0;
    debugLogger.debug(`Cleared logs for extension: ${this.extensionName}`);
  }

  // Level-specific methods

  getLogLevel(): ExtensionLogLevel {
    return this.config.logLevel;
  }

  setLogLevel(level: ExtensionLogLevel): void {
    this.config.logLevel = level;
  }

  isDebugEnabled(): boolean {
    return this.shouldLog('debug');
  }

  // File logging methods

  getLogFilePath(): string {
    return this.logFilePath;
  }

  async rotateLogs(): Promise<void> {
    if (!this.config.enableFileLogging) {
      return;
    }

    try {
      // Close current log file
      if (fs.existsSync(this.logFilePath)) {
        const rotatedPath = `${this.logFilePath}.${Date.now()}`;
        await fs.promises.rename(this.logFilePath, rotatedPath);
        this.currentLogSize = 0;

        // Clean up old log files
        await this.cleanupOldLogFiles();
      }
    } catch (error) {
      debugLogger.error('Failed to rotate logs:', error);
    }
  }

  // Private methods

  private log(
    level: ExtensionLogLevel,
    message: string,
    error?: Error,
    data?: Record<string, unknown>,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: ExtensionLogEntry = {
      timestamp: new Date(),
      extensionId: this.extensionId,
      extensionName: this.extensionName,
      level,
      message,
      data,
      error: this.config.includeStackTrace ? error : undefined,
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Write to debug logger
    const logMessage = `[${this.extensionName}] ${message}`;
    switch (level) {
      case 'debug':
        debugLogger.debug(logMessage, data);
        break;
      case 'info':
        debugLogger.info(logMessage, data);
        break;
      case 'warn':
        debugLogger.warn(logMessage, data);
        break;
      case 'error':
        debugLogger.error(logMessage, error, data);
        break;
      default:
        // Unknown log level, use info as fallback
        debugLogger.info(logMessage, data);
        break;
    }

    // Write to file
    if (this.config.enableFileLogging) {
      this.writeToFile(entry);
    }
  }

  private shouldLog(level: ExtensionLogLevel): boolean {
    const levels: ExtensionLogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(level);
    const thresholdIndex = levels.indexOf(this.config.logLevel);
    return currentIndex >= thresholdIndex;
  }

  private writeToFile(entry: ExtensionLogEntry): void {
    try {
      const logLine = this.formatLogEntry(entry);

      // Check if rotation is needed
      if (this.currentLogSize + logLine.length > this.config.maxFileSize) {
        this.rotateLogs();
      }

      fs.appendFileSync(this.logFilePath, logLine + '\n');
      this.currentLogSize += logLine.length + 1;
    } catch (error) {
      debugLogger.error('Failed to write to log file:', error);
    }
  }

  private formatLogEntry(entry: ExtensionLogEntry): string {
    const parts: string[] = [];

    if (this.config.includeTimestamps) {
      parts.push(`[${entry.timestamp.toISOString()}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);
    parts.push(`[${entry.extensionName}]`);
    parts.push(entry.message);

    if (entry.data) {
      parts.push(JSON.stringify(entry.data));
    }

    if (entry.error && this.config.includeStackTrace) {
      parts.push(`\nError: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\nStack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  private getDefaultLogDirectory(): string {
    const ollamaDir = path.join(os.homedir(), '.ollama-code');
    return path.join(ollamaDir, 'logs', 'extensions');
  }

  private ensureLogDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initializeLogFile(): void {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const stats = fs.statSync(this.logFilePath);
        this.currentLogSize = stats.size;
      } else {
        fs.writeFileSync(this.logFilePath, '');
        this.currentLogSize = 0;
      }
    } catch (error) {
      debugLogger.error('Failed to initialize log file:', error);
    }
  }

  private async cleanupOldLogFiles(): Promise<void> {
    const dir = path.dirname(this.logFilePath);
    const baseName = path.basename(this.logFilePath);
    const pattern = new RegExp(`^${this.escapeRegex(baseName)}\\.\\d+$`);

    try {
      const files = await fs.promises.readdir(dir);
      const logFiles = files
        .filter((f) => pattern.test(f))
        .map((f) => ({
          name: f,
          path: path.join(dir, f),
          time: fs.statSync(path.join(dir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      // Remove old files beyond the limit
      for (let i = this.config.maxLogFiles; i < logFiles.length; i++) {
        await fs.promises.unlink(logFiles[i].path);
        debugLogger.debug(`Removed old log file: ${logFiles[i].name}`);
      }
    } catch (error) {
      debugLogger.error('Failed to cleanup old log files:', error);
    }
  }

  private sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ============================================================================
// Extension Logger Manager
// ============================================================================

/**
 * Manages loggers for all extensions.
 */
export class ExtensionLoggerManager {
  private readonly loggers: Map<string, ExtensionLogger> = new Map();
  private readonly config: ExtensionLoggerConfig;

  constructor(config: Partial<ExtensionLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get or create a logger for an extension.
   */
  getLogger(
    extensionId: string,
    extensionName: string,
  ): ExtensionLoggerInterface {
    let logger = this.loggers.get(extensionId);
    if (!logger) {
      logger = new ExtensionLogger(extensionId, extensionName, this.config);
      this.loggers.set(extensionId, logger);
    }
    return logger;
  }

  /**
   * Remove a logger for an extension.
   */
  removeLogger(extensionId: string): void {
    this.loggers.delete(extensionId);
  }

  /**
   * Get all log entries from all extensions.
   */
  getAllLogs(): ExtensionLogEntry[] {
    const allLogs: ExtensionLogEntry[] = [];
    for (const logger of this.loggers.values()) {
      allLogs.push(...logger.getLogs());
    }
    return allLogs.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  /**
   * Get logs for a specific extension.
   */
  getExtensionLogs(extensionId: string): ExtensionLogEntry[] {
    const logger = this.loggers.get(extensionId);
    return logger?.getLogs() ?? [];
  }

  /**
   * Clear all logs.
   */
  clearAllLogs(): void {
    for (const logger of this.loggers.values()) {
      logger.clearLogs();
    }
  }

  /**
   * Set log level for all loggers.
   */
  setGlobalLogLevel(level: ExtensionLogLevel): void {
    this.config.logLevel = level;
    for (const logger of this.loggers.values()) {
      logger.setLogLevel(level);
    }
  }

  /**
   * Get statistics about logging.
   */
  getStats(): {
    totalLoggers: number;
    totalLogs: number;
    logLevels: Record<ExtensionLogLevel, number>;
  } {
    let totalLogs = 0;
    const logLevels: Record<ExtensionLogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    for (const logger of this.loggers.values()) {
      const logs = logger.getLogs();
      totalLogs += logs.length;

      for (const log of logs) {
        logLevels[log.level]++;
      }
    }

    return {
      totalLoggers: this.loggers.size,
      totalLogs,
      logLevels,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalManager: ExtensionLoggerManager | null = null;

/**
 * Get the global extension logger manager instance.
 */
export function getExtensionLoggerManager(): ExtensionLoggerManager {
  if (!globalManager) {
    globalManager = new ExtensionLoggerManager();
  }
  return globalManager;
}

/**
 * Reset the global manager (for testing).
 */
export function resetExtensionLoggerManager(): void {
  globalManager = null;
}

/**
 * Create a logger for an extension.
 */
export function createExtensionLogger(
  extensionId: string,
  extensionName: string,
  config?: Partial<ExtensionLoggerConfig>,
): ExtensionLoggerInterface {
  return new ExtensionLogger(extensionId, extensionName, config);
}
