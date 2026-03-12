/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Logging utilities for resource managers.
 * Provides structured logging with resource-specific context.
 */

import { createLogger, type StructuredLogger } from './structuredLogger.js';
import type { BaseResourceConfig, ResourceLevel, ResourceError } from '../unified/types.js';

/**
 * Context for resource-related log entries.
 */
export interface ResourceLogContext<T extends BaseResourceConfig = BaseResourceConfig> {
  /** Resource type (skill, agent, subagent) */
  resourceType: string;

  /** Resource name */
  resourceName?: string;

  /** Resource level */
  resourceLevel?: ResourceLevel;

  /** Full resource config (will be sanitized) */
  resource?: T;

  /** Operation being performed */
  operation: string;

  /** Duration in milliseconds */
  duration?: number;

  /** Error if operation failed */
  error?: Error | ResourceError;

  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Resource logger provides structured logging for resource operations.
 */
export class ResourceLogger {
  private readonly logger: StructuredLogger;

  constructor(resourceType: string) {
    this.logger = createLogger(resourceType.toUpperCase());
  }

  /**
   * Logs a resource operation start.
   */
  logOperationStart(context: Omit<ResourceLogContext, 'duration' | 'error'>): void {
    this.logger.debug(`Operation started: ${context.operation}`, {
      resourceType: context.resourceType,
      resourceName: context.resourceName,
      resourceLevel: context.resourceLevel,
      operation: context.operation,
    });
  }

  /**
   * Logs a successful resource operation.
   */
  logOperationSuccess(
    context: Omit<ResourceLogContext, 'error'>,
  ): void {
    const logData: Record<string, unknown> = {
      resourceType: context.resourceType,
      resourceName: context.resourceName,
      resourceLevel: context.resourceLevel,
      operation: context.operation,
    };

    if (context.duration !== undefined) {
      logData.duration = context.duration;
    }

    this.logger.info(
      `Operation completed: ${context.operation}`,
      logData,
    );
  }

  /**
   * Logs a failed resource operation.
   */
  logOperationError(context: ResourceLogContext): void {
    const logData: Record<string, unknown> = {
      resourceType: context.resourceType,
      resourceName: context.resourceName,
      resourceLevel: context.resourceLevel,
      operation: context.operation,
    };

    if (context.duration !== undefined) {
      logData.duration = context.duration;
    }

    this.logger.error(
      `Operation failed: ${context.operation}`,
      context.error,
      logData,
    );
  }

  /**
   * Logs resource cache hit.
   */
  logCacheHit(resourceType: string, resourceName: string, level?: ResourceLevel): void {
    this.logger.debug('Cache hit', {
      resourceType,
      resourceName,
      resourceLevel: level,
      cacheHit: true,
    });
  }

  /**
   * Logs resource cache miss.
   */
  logCacheMiss(resourceType: string, resourceName: string, level?: ResourceLevel): void {
    this.logger.debug('Cache miss', {
      resourceType,
      resourceName,
      resourceLevel: level,
      cacheHit: false,
    });
  }

  /**
   * Logs resource cache refresh.
   */
  logCacheRefresh(resourceType: string, count: number): void {
    this.logger.info('Cache refreshed', {
      resourceType,
      resourceCount: count,
    });
  }

  /**
   * Logs resource validation.
   */
  logValidation(
    resourceType: string,
    resourceName: string,
    isValid: boolean,
    errors: string[],
    warnings: string[],
  ): void {
    if (isValid) {
      this.logger.debug('Validation passed', {
        resourceType,
        resourceName,
        warningCount: warnings.length,
      });
    } else {
      this.logger.warn('Validation failed', {
        resourceType,
        resourceName,
        errors,
        warnings,
      });
    }
  }

  /**
   * Logs resource file operation.
   */
  logFileOperation(
    operation: 'read' | 'write' | 'delete' | 'watch',
    filePath: string,
    success: boolean,
    error?: Error,
  ): void {
    if (success) {
      this.logger.debug(`File ${operation} successful`, {
        operation,
        filePath,
      });
    } else {
      this.logger.error(`File ${operation} failed`, error, {
        operation,
        filePath,
      });
    }
  }

  /**
   * Logs resource change event.
   */
  logChangeEvent(
    resourceType: string,
    changeType: 'create' | 'update' | 'delete' | 'refresh',
    resourceName?: string,
    source?: string,
  ): void {
    this.logger.info('Resource changed', {
      resourceType,
      changeType,
      resourceName,
      source,
    });
  }

  /**
   * Creates a traced operation that logs start/end/error.
   */
  traceOperation<T extends BaseResourceConfig>(
    context: Omit<ResourceLogContext<T>, 'duration' | 'error'>,
  ): {
    success: () => void;
    error: (error: Error) => void;
  } {
    const start = Date.now();
    this.logOperationStart(context);

    return {
      success: () => {
        this.logOperationSuccess({
          ...context,
          duration: Date.now() - start,
        });
      },
      error: (error: Error) => {
        this.logOperationError({
          ...context,
          duration: Date.now() - start,
          error,
        });
      },
    };
  }

  /**
   * Times an async operation and logs the result.
   */
  async timeOperation<T>(
    context: Omit<ResourceLogContext, 'duration' | 'error' | 'data'>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      this.logOperationSuccess({
        ...context,
        duration: Date.now() - start,
      });
      return result;
    } catch (error) {
      this.logOperationError({
        ...context,
        duration: Date.now() - start,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }
}

/**
 * Creates a resource logger for a specific resource type.
 */
export function createResourceLogger(resourceType: string): ResourceLogger {
  return new ResourceLogger(resourceType);
}

/**
 * Decorator for logging resource operations.
 * Use this to automatically log method calls on resource managers.
 */
export function LogOperation(operation: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const manager = this as { resourceType?: string; logger?: ResourceLogger };
      const resourceType = manager.resourceType || 'resource';
      const logger = manager.logger || createResourceLogger(resourceType);

      const start = Date.now();
      logger.logOperationStart({
        resourceType,
        operation,
        resourceName: typeof args[0] === 'string' ? args[0] : undefined,
      });

      try {
        const result = await originalMethod.apply(this, args);
        logger.logOperationSuccess({
          resourceType,
          operation,
          resourceName: typeof args[0] === 'string' ? args[0] : undefined,
          duration: Date.now() - start,
        });
        return result;
      } catch (error) {
        logger.logOperationError({
          resourceType,
          operation,
          resourceName: typeof args[0] === 'string' ? args[0] : undefined,
          duration: Date.now() - start,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        throw error;
      }
    };

    return descriptor;
  };
}
