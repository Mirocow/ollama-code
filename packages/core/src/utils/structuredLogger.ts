/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Structured Logger - JSON-formatted logging with correlation IDs and timing
 *
 * Provides consistent, parseable log output for debugging and monitoring.
 * Each log entry is a JSON object with timestamp, level, module, message,
 * and optional data/correlation ID.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export interface StructuredLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  module: string;
  message: string;
  data?: Record<string, unknown>;
  duration?: number;
  correlationId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LogContext {
  correlationId: string;
  parentModule?: string;
}

const logContextStorage = new AsyncLocalStorage<LogContext>();

/**
 * Get the current correlation ID from async context
 */
export function getCorrelationId(): string | undefined {
  return logContextStorage.getStore()?.correlationId;
}

/**
 * Run a function with a correlation ID bound to the async context
 */
export function withCorrelationId<T>(correlationId: string, fn: () => T): T {
  const existingContext = logContextStorage.getStore();
  return logContextStorage.run(
    {
      correlationId,
      parentModule: existingContext?.parentModule,
    },
    fn,
  );
}

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Structured Logger class
 */
class StructuredLogger {
  private minLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug';
  private output: (entry: StructuredLogEntry) => void;

  constructor(options?: {
    minLevel?: 'debug' | 'info' | 'warn' | 'error';
    output?: (entry: StructuredLogEntry) => void;
  }) {
    if (options?.minLevel) {
      this.minLevel = options.minLevel;
    }
    this.output = options?.output ?? this.defaultOutput;
  }

  private defaultOutput(entry: StructuredLogEntry): void {
    const output = JSON.stringify(entry);
    switch (entry.level) {
      case 'error':
        // eslint-disable-next-line no-console
        console.error(output);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(output);
        break;
      case 'debug':
        // Only output if OLLAMA_CODE_DEBUG is set
        if (process.env['OLLAMA_CODE_DEBUG_LOG_FILE']) {
          // eslint-disable-next-line no-console
          console.debug(output);
        }
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(output);
    }
  }

  private shouldLog(level: StructuredLogEntry['level']): boolean {
    const levels: Array<StructuredLogEntry['level']> = [
      'debug',
      'info',
      'warn',
      'error',
    ];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private createEntry(
    level: StructuredLogEntry['level'],
    module: string,
    message: string,
    data?: Record<string, unknown>,
    duration?: number,
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
    };

    const context = logContextStorage.getStore();
    if (context?.correlationId) {
      entry.correlationId = context.correlationId;
    }

    if (data) {
      entry.data = data;
    }

    if (duration !== undefined) {
      entry.duration = duration;
    }

    return entry;
  }

  debug(module: string, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    this.output(this.createEntry('debug', module, message, data));
  }

  info(module: string, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    this.output(this.createEntry('info', module, message, data));
  }

  warn(module: string, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    this.output(this.createEntry('warn', module, message, data));
  }

  error(
    module: string,
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ): void {
    if (!this.shouldLog('error')) return;

    const entry = this.createEntry('error', module, message, data);

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error !== undefined) {
      entry.data = { ...entry.data, error: String(error) };
    }

    this.output(entry);
  }

  /**
   * Time an operation and log the duration
   */
  async time<T>(
    module: string,
    operation: string,
    fn: () => T | Promise<T>,
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.output(
        this.createEntry(
          'debug',
          module,
          `${operation} completed`,
          undefined,
          duration,
        ),
      );
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const entry = this.createEntry(
        'error',
        module,
        `${operation} failed`,
        undefined,
        duration,
      );

      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (error !== undefined) {
        entry.data = { error: String(error) };
      }

      this.output(entry);
      throw error;
    }
  }

  /**
   * Create a child logger with a fixed module name
   */
  module(moduleName: string): ModuleLogger {
    return new ModuleLogger(this, moduleName);
  }
}

/**
 * Module-scoped logger with a fixed module name
 */
class ModuleLogger {
  constructor(
    private readonly logger: StructuredLogger,
    private readonly moduleName: string,
  ) {}

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(this.moduleName, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(this.moduleName, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(this.moduleName, message, data);
  }

  error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ): void {
    this.logger.error(this.moduleName, message, error, data);
  }

  async time<T>(operation: string, fn: () => T | Promise<T>): Promise<T> {
    return this.logger.time(this.moduleName, operation, fn);
  }
}

// Export singleton instance
export const structuredLogger = new StructuredLogger();

// Export class for custom instances
export { StructuredLogger };

// Export module logger for type inference
export type { ModuleLogger };
