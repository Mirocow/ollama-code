/**
 * Structured Logger Service
 *
 * Provides unified structured logging across all components.
 * Supports multiple log levels, output formats, and destinations.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { inspect } from 'node:util';
import { getOllamaDir } from '../utils/paths.js';

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Log output format
 */
export type LogFormat = 'json' | 'text' | 'pretty';

/**
 * Log destination
 */
export type LogDestination = 'console' | 'file' | 'both';

/**
 * Log context metadata
 */
export interface LogContext {
  /** Component/module name */
  component?: string;

  /** Operation being performed */
  operation?: string;

  /** Session ID */
  sessionId?: string;

  /** Tool name */
  toolName?: string;

  /** Request ID for tracing */
  requestId?: string;

  /** User ID */
  userId?: string;

  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  /** Timestamp in ISO format */
  timestamp: string;

  /** Log level */
  level: LogLevel;

  /** Log message */
  message: string;

  /** Component/module */
  component?: string;

  /** Operation */
  operation?: string;

  /** Session ID */
  sessionId?: string;

  /** Request ID for tracing */
  requestId?: string;

  /** Duration in milliseconds */
  duration?: number;

  /** Error details */
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };

  /** Additional data */
  data?: Record<string, unknown>;

  /** Tags for categorization */
  tags?: string[];

  /** Context fields */
  [key: string]: unknown;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level */
  level: LogLevel;

  /** Output format */
  format: LogFormat;

  /** Output destination */
  destination: LogDestination;

  /** Log file path */
  logFilePath: string;

  /** Maximum log file size in bytes */
  maxFileSize: number;

  /** Include timestamps */
  includeTimestamp: boolean;

  /** Include stack traces for errors */
  includeStackTrace: boolean;

  /** Pretty print JSON */
  prettyPrint: boolean;

  /** Colorize console output */
  colorize: boolean;

  /** Include hostname */
  includeHostname: boolean;

  /** Include process ID */
  includePid: boolean;

  /** Default context fields */
  defaultContext: LogContext;

  /** Redact sensitive fields */
  redactFields: string[];

  /** Mask for redacted fields */
  redactMask: string;
}

/**
 * Default logger configuration
 */
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'info',
  format: 'text',
  destination: 'console',
  logFilePath: '',
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  includeTimestamp: true,
  includeStackTrace: true,
  prettyPrint: false,
  colorize: true,
  includeHostname: false,
  includePid: false,
  defaultContext: {},
  redactFields: [
    'password',
    'apiKey',
    'api_key',
    'token',
    'secret',
    'credential',
    'privateKey',
    'private_key',
    'accessToken',
    'access_token',
    'authorization',
    'cookie',
  ],
  redactMask: '[REDACTED]',
};

/**
 * Log level priority
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * Log level colors
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  fatal: '\x1b[35m', // Magenta
};

/**
 * ANSI reset code
 */
const ANSI_RESET = '\x1b[0m';

/**
 * Structured Logger class
 */
export class StructuredLogger {
  private config: LoggerConfig;
  private logPath: string;
  private hostname: string;
  private pid: number;
  private context: LogContext;

  constructor(
    private readonly name: string,
    config: Partial<LoggerConfig> = {},
  ) {
    this.config = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.hostname = os.hostname();
    this.pid = process.pid;
    this.context = { ...this.config.defaultContext };

    // Set log file path
    if (!this.config.logFilePath) {
      this.logPath = path.join(getOllamaDir(), 'logs', `${name}.log`);
    } else {
      this.logPath = this.config.logFilePath;
    }

    // Ensure log directory exists
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): StructuredLogger {
    const child = new StructuredLogger(this.name, this.config);
    child.context = { ...this.context, ...context };
    return child;
  }

  /**
   * Set context field
   */
  setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const currentPriority = LOG_LEVEL_PRIORITY[this.config.level];
    const entryPriority = LOG_LEVEL_PRIORITY[level];
    return entryPriority >= currentPriority;
  }

  /**
   * Redact sensitive fields
   */
  private redact(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redact(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      const shouldRedact = this.config.redactFields.some((field) =>
        lowerKey.includes(field.toLowerCase()),
      );

      if (shouldRedact) {
        result[key] = this.config.redactMask;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.redact(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Format log entry
   */
  private formatEntry(entry: LogEntry): string {
    switch (this.config.format) {
      case 'json':
        return this.formatJson(entry);

      case 'pretty':
        return this.formatPretty(entry);

      case 'text':
      default:
        return this.formatText(entry);
    }
  }

  /**
   * Format as JSON
   */
  private formatJson(entry: LogEntry): string {
    const redacted = this.redact(entry) as LogEntry;
    return JSON.stringify(redacted, null, this.config.prettyPrint ? 2 : 0);
  }

  /**
   * Format as text
   */
  private formatText(entry: LogEntry): string {
    const timestamp = entry.timestamp.substring(11, 19);
    const level = entry.level.toUpperCase().padEnd(5);
    const component = entry.component ? `[${entry.component}]` : '';
    const operation = entry.operation ? `(${entry.operation})` : '';

    let message = `${timestamp} ${level} ${component}${operation} ${entry.message}`;

    if (entry.duration !== undefined) {
      message += ` [${entry.duration}ms]`;
    }

    if (entry.error) {
      message += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack && this.config.includeStackTrace) {
        message += `\n  ${entry.error.stack}`;
      }
    }

    if (entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = inspect(this.redact(entry.data), {
        depth: 3,
        colors: this.config.colorize,
        compact: true,
      });
      message += `\n  Data: ${dataStr}`;
    }

    return message;
  }

  /**
   * Format as pretty
   */
  private formatPretty(entry: LogEntry): string {
    const color = this.config.colorize ? LOG_LEVEL_COLORS[entry.level] : '';
    const reset = this.config.colorize ? ANSI_RESET : '';

    const timestamp = entry.timestamp.substring(11, 19);
    const level = entry.level.toUpperCase().padEnd(5);
    const component = entry.component
      ? `\x1b[36m[${entry.component}]\x1b[0m`
      : '';
    const operation = entry.operation
      ? `\x1b[33m(${entry.operation})\x1b[0m`
      : '';

    let message = `${timestamp} ${color}${level}${reset} ${component}${operation} ${entry.message}`;

    if (entry.duration !== undefined) {
      message += ` \x1b[90m[${entry.duration}ms]\x1b[0m`;
    }

    if (entry.error) {
      message += `\n  \x1b[31mError: ${entry.error.name}: ${entry.error.message}\x1b[0m`;
      if (entry.error.stack && this.config.includeStackTrace) {
        message += `\n  \x1b[90m${entry.error.stack}\x1b[0m`;
      }
    }

    if (entry.data && Object.keys(entry.data).length > 0) {
      const dataStr = inspect(this.redact(entry.data), {
        depth: 4,
        colors: true,
        compact: false,
      });
      message += `\n  \x1b[90mData:\x1b[0m ${dataStr}`;
    }

    return message;
  }

  /**
   * Write log to destination
   */
  private write(formatted: string, entry: LogEntry): void {
    if (
      this.config.destination === 'console' ||
      this.config.destination === 'both'
    ) {
      if (entry.level === 'error' || entry.level === 'fatal') {
        console.error(formatted);
      } else if (entry.level === 'warn') {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }
    }

    if (
      this.config.destination === 'file' ||
      this.config.destination === 'both'
    ) {
      try {
        // Check file size and rotate if needed
        this.rotateIfNeeded();

        fs.appendFileSync(this.logPath, formatted + '\n', 'utf-8');
      } catch (error) {
        console.error('Failed to write log file:', error);
      }
    }
  }

  /**
   * Rotate log file if needed
   */
  private rotateIfNeeded(): void {
    if (this.config.maxFileSize === 0) return;

    try {
      if (!fs.existsSync(this.logPath)) return;

      const stats = fs.statSync(this.logPath);
      if (stats.size >= this.config.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = `${this.logPath}.${timestamp}`;
        fs.renameSync(this.logPath, rotatedPath);
      }
    } catch {
      // Ignore rotation errors
    }
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error,
    duration?: number,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      component: this.name,
      ...this.context,
    };

    if (duration !== undefined) {
      entry.duration = duration;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined,
        code: (error as NodeJS.ErrnoException).code,
      };
    }

    if (data && Object.keys(data).length > 0) {
      entry.data = data;
    }

    if (this.config.includeHostname) {
      entry['hostname'] = this.hostname;
    }

    if (this.config.includePid) {
      entry['pid'] = this.pid;
    }

    return entry;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.createEntry('debug', message, data);
    this.write(this.formatEntry(entry), entry);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;

    const entry = this.createEntry('info', message, data);
    this.write(this.formatEntry(entry), entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createEntry('warn', message, data);
    this.write(this.formatEntry(entry), entry);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;

    const entry = this.createEntry('error', message, data, error);
    this.write(this.formatEntry(entry), entry);
  }

  /**
   * Log fatal message
   */
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (!this.shouldLog('fatal')) return;

    const entry = this.createEntry('fatal', message, data, error);
    this.write(this.formatEntry(entry), entry);
  }

  /**
   * Log with timing
   */
  time<T>(operation: string, fn: () => T): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.debug(`Operation completed: ${operation}`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Operation failed: ${operation}`, error as Error, {
        duration,
      });
      throw error;
    }
  }

  /**
   * Log async operation with timing
   */
  async timeAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.debug(`Operation completed: ${operation}`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Operation failed: ${operation}`, error as Error, {
        duration,
      });
      throw error;
    }
  }

  /**
   * Create a traceable operation
   */
  trace(operation: string): {
    end: (data?: Record<string, unknown>) => void;
    error: (error: Error, data?: Record<string, unknown>) => void;
  } {
    const start = Date.now();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

    this.debug(`Operation started: ${operation}`, { requestId });

    return {
      end: (data?: Record<string, unknown>) => {
        const duration = Date.now() - start;
        this.debug(`Operation completed: ${operation}`, {
          requestId,
          duration,
          ...data,
        });
      },
      error: (error: Error, data?: Record<string, unknown>) => {
        const duration = Date.now() - start;
        this.error(`Operation failed: ${operation}`, error, {
          requestId,
          duration,
          ...data,
        });
      },
    };
  }

  /**
   * Get log file path
   */
  getLogPath(): string {
    return this.logPath;
  }

  /**
   * Clear log file
   */
  clear(): void {
    try {
      if (fs.existsSync(this.logPath)) {
        fs.unlinkSync(this.logPath);
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Logger registry
 */
class LoggerRegistry {
  private loggers: Map<string, StructuredLogger> = new Map();
  private defaultConfig: LoggerConfig;

  constructor() {
    this.defaultConfig = { ...DEFAULT_LOGGER_CONFIG };
  }

  /**
   * Set default configuration for all new loggers
   */
  setDefaultConfig(config: Partial<LoggerConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get or create logger
   */
  get(name: string, config?: Partial<LoggerConfig>): StructuredLogger {
    if (!this.loggers.has(name)) {
      this.loggers.set(
        name,
        new StructuredLogger(name, { ...this.defaultConfig, ...config }),
      );
    }
    return this.loggers.get(name)!;
  }

  /**
   * Check if logger exists
   */
  has(name: string): boolean {
    return this.loggers.has(name);
  }

  /**
   * Remove logger
   */
  remove(name: string): boolean {
    return this.loggers.delete(name);
  }

  /**
   * Get all logger names
   */
  names(): string[] {
    return Array.from(this.loggers.keys());
  }
}

// Export singleton registry
export const loggerRegistry = new LoggerRegistry();

/**
 * Create or get a logger
 */
export function createLogger(
  name: string,
  config?: Partial<LoggerConfig>,
): StructuredLogger {
  return loggerRegistry.get(name, config);
}
