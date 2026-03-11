/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extension Lifecycle Manager
 *
 * Manages the lifecycle events for extensions, including
 * activation, deactivation, installation, update, and uninstallation.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import { createDebugLogger } from '../utils/debugLogger.js';
import type {
  ExtensionLifecycleDefinition,
  ExtensionLifecycleEvent,
  ExtensionLifecycleContext,
  ExtensionLifecycleResult,
  ExtensionLifecycleHandler,
  ExtensionV2,
  ExtensionLoggerInterface,
} from './extension-types.js';

const debugLogger = createDebugLogger('EXTENSION_LIFECYCLE');

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the ExtensionLifecycleManager.
 */
export interface ExtensionLifecycleOptions {
  /** Timeout for lifecycle hooks in milliseconds */
  hookTimeout: number;

  /** Whether to continue on hook failures */
  continueOnFailure: boolean;

  /** Maximum number of retry attempts for failed hooks */
  maxRetries: number;

  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
}

const DEFAULT_OPTIONS: ExtensionLifecycleOptions = {
  hookTimeout: 30000, // 30 seconds
  continueOnFailure: true,
  maxRetries: 1,
  retryDelay: 1000,
};

/**
 * Result of a lifecycle event execution.
 */
export interface LifecycleEventResult {
  /** Whether all hooks completed successfully */
  success: boolean;

  /** Results for each hook that was executed */
  results: Array<{
    event: ExtensionLifecycleEvent;
    extensionId: string;
    success: boolean;
    message?: string;
    error?: Error;
    duration: number;
  }>;
}

/**
 * Hook execution context with additional runtime information.
 */
interface HookExecutionContext extends ExtensionLifecycleContext {
  /** The lifecycle event being handled */
  event: ExtensionLifecycleEvent;

  /** Timeout for this specific hook */
  timeout: number;
}

// ============================================================================
// Extension Lifecycle Manager
// ============================================================================

/**
 * Manages lifecycle events for extensions.
 */
export class ExtensionLifecycleManager {
  private readonly options: ExtensionLifecycleOptions;
  private readonly executedHooks: Map<string, Set<ExtensionLifecycleEvent>> =
    new Map();

  constructor(options: Partial<ExtensionLifecycleOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute lifecycle hooks for an extension.
   * @param extension The extension
   * @param event The lifecycle event
   * @param context Additional context for the event
   * @returns Result of the lifecycle event execution
   */
  async executeLifecycleEvent(
    extension: ExtensionV2,
    event: ExtensionLifecycleEvent,
    context?: Partial<ExtensionLifecycleContext>,
  ): Promise<LifecycleEventResult> {
    const results: LifecycleEventResult['results'] = [];
    let overallSuccess = true;

    const lifecycle = extension.lifecycle;
    if (!lifecycle) {
      debugLogger.debug(
        `No lifecycle hooks defined for extension: ${extension.name}`,
      );
      return { success: true, results: [] };
    }

    const hookPath = this.getHookPath(lifecycle, event);
    if (!hookPath) {
      debugLogger.debug(
        `No hook defined for event ${event} in extension: ${extension.name}`,
      );
      return { success: true, results: [] };
    }

    const startTime = Date.now();

    try {
      const result = await this.executeHook(
        extension,
        hookPath,
        event,
        context,
      );
      results.push({
        event,
        extensionId: extension.id,
        success: result.success,
        message: result.message,
        error: result.error,
        duration: Date.now() - startTime,
      });

      if (!result.success) {
        overallSuccess = false;
      }

      // Mark event as executed
      this.markEventExecuted(extension.id, event);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      results.push({
        event,
        extensionId: extension.id,
        success: false,
        error: err,
        duration: Date.now() - startTime,
      });
      overallSuccess = false;

      debugLogger.error(
        `Failed to execute lifecycle hook for ${extension.name}:`,
        err,
      );

      if (!this.options.continueOnFailure) {
        throw err;
      }
    }

    return {
      success: overallSuccess,
      results,
    };
  }

  /**
   * Activate an extension.
   * Runs the onActivate hook if defined.
   */
  async activate(extension: ExtensionV2): Promise<LifecycleEventResult> {
    debugLogger.info(`Activating extension: ${extension.name}`);
    return this.executeLifecycleEvent(extension, 'activate');
  }

  /**
   * Deactivate an extension.
   * Runs the onDeactivate hook if defined.
   */
  async deactivate(extension: ExtensionV2): Promise<LifecycleEventResult> {
    debugLogger.info(`Deactivating extension: ${extension.name}`);
    return this.executeLifecycleEvent(extension, 'deactivate');
  }

  /**
   * Install an extension.
   * Runs the onInstall hook if defined.
   */
  async install(extension: ExtensionV2): Promise<LifecycleEventResult> {
    debugLogger.info(`Installing extension: ${extension.name}`);
    return this.executeLifecycleEvent(extension, 'install');
  }

  /**
   * Update an extension.
   * Runs the onUpdate hook if defined.
   */
  async update(
    extension: ExtensionV2,
    previousVersion?: string,
  ): Promise<LifecycleEventResult> {
    debugLogger.info(
      `Updating extension: ${extension.name} from ${previousVersion ?? 'unknown'} to ${extension.version}`,
    );
    return this.executeLifecycleEvent(extension, 'update', { previousVersion });
  }

  /**
   * Uninstall an extension.
   * Runs the onUninstall hook if defined.
   */
  async uninstall(extension: ExtensionV2): Promise<LifecycleEventResult> {
    debugLogger.info(`Uninstalling extension: ${extension.name}`);
    return this.executeLifecycleEvent(extension, 'uninstall');
  }

  /**
   * Check if a lifecycle event has been executed for an extension.
   */
  hasEventBeenExecuted(
    extensionId: string,
    event: ExtensionLifecycleEvent,
  ): boolean {
    const events = this.executedHooks.get(extensionId);
    return events?.has(event) ?? false;
  }

  /**
   * Clear the executed events cache for an extension.
   */
  clearExtensionEvents(extensionId: string): void {
    this.executedHooks.delete(extensionId);
  }

  /**
   * Clear all executed events cache.
   */
  clearAllEvents(): void {
    this.executedHooks.clear();
  }

  // Private methods

  private getHookPath(
    lifecycle: ExtensionLifecycleDefinition,
    event: ExtensionLifecycleEvent,
  ): string | null {
    switch (event) {
      case 'activate':
        return lifecycle.onActivate ?? null;
      case 'deactivate':
        return lifecycle.onDeactivate ?? null;
      case 'install':
        return lifecycle.onInstall ?? null;
      case 'update':
        return lifecycle.onUpdate ?? null;
      case 'uninstall':
        return lifecycle.onUninstall ?? null;
      default:
        return null;
    }
  }

  private async executeHook(
    extension: ExtensionV2,
    hookPath: string,
    event: ExtensionLifecycleEvent,
    context?: Partial<ExtensionLifecycleContext>,
  ): Promise<ExtensionLifecycleResult> {
    const fullHookPath = path.join(extension.path, hookPath);

    if (!fs.existsSync(fullHookPath)) {
      debugLogger.warn(`Hook file not found: ${fullHookPath}`);
      return {
        success: false,
        message: `Hook file not found: ${hookPath}`,
        error: new Error(`Hook file not found: ${hookPath}`),
      };
    }

    // Create execution context
    const executionContext: HookExecutionContext = {
      event,
      extensionId: extension.id,
      extensionName: extension.name,
      extensionVersion: extension.version,
      extensionPath: extension.path,
      timeout: this.options.hookTimeout,
      logger: extension.logger ?? this.createDefaultLogger(extension),
      config: extension.resolvedSettings ?? {},
      ...context,
    };

    // Execute with retries
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const handler = await this.loadHandler(fullHookPath);
        const result = await this.executeWithTimeout(handler, executionContext);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        debugLogger.warn(
          `Hook execution attempt ${attempt + 1} failed for ${extension.name}:`,
          lastError,
        );

        if (attempt < this.options.maxRetries) {
          await this.delay(this.options.retryDelay);
        }
      }
    }

    return {
      success: false,
      message: lastError?.message ?? 'Unknown error',
      error: lastError,
    };
  }

  private async loadHandler(
    hookPath: string,
  ): Promise<ExtensionLifecycleHandler> {
    try {
      const handlerModule = await import(hookPath);
      const handler: ExtensionLifecycleHandler =
        handlerModule.default || handlerModule;

      if (typeof handler.handle !== 'function') {
        throw new Error('Handler module must export a handle function');
      }

      return handler;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new Error(`Failed to load handler: ${err.message}`);
    }
  }

  private async executeWithTimeout(
    handler: ExtensionLifecycleHandler,
    context: HookExecutionContext,
  ): Promise<ExtensionLifecycleResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Hook execution timed out after ${context.timeout}ms`),
        );
      }, context.timeout);

      handler
        .handle(context.event, context)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private markEventExecuted(
    extensionId: string,
    event: ExtensionLifecycleEvent,
  ): void {
    let events = this.executedHooks.get(extensionId);
    if (!events) {
      events = new Set();
      this.executedHooks.set(extensionId, events);
    }
    events.add(event);
  }

  private createDefaultLogger(
    extension: ExtensionV2,
  ): ExtensionLoggerInterface {
    return {
      debug: (message, data) =>
        debugLogger.debug(`[${extension.name}] ${message}`, data),
      info: (message, data) =>
        debugLogger.info(`[${extension.name}] ${message}`, data),
      warn: (message, data) =>
        debugLogger.warn(`[${extension.name}] ${message}`, data),
      error: (message, error, data) =>
        debugLogger.error(`[${extension.name}] ${message}`, error, data),
      getLogs: () => [],
      clearLogs: () => {},
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Built-in Lifecycle Handlers
// ============================================================================

/**
 * Example lifecycle handler for reference.
 */
export const exampleLifecycleHandler: ExtensionLifecycleHandler = {
  async handle(
    event: ExtensionLifecycleEvent,
    context: ExtensionLifecycleContext,
  ): Promise<ExtensionLifecycleResult> {
    context.logger.info(`Lifecycle event triggered: ${event}`, {
      extensionId: context.extensionId,
      extensionName: context.extensionName,
      extensionVersion: context.extensionVersion,
    });

    switch (event) {
      case 'activate':
        // Perform activation logic
        break;
      case 'deactivate':
        // Perform deactivation logic
        break;
      case 'install':
        // Perform installation logic
        break;
      case 'update':
        // Perform update logic
        break;
      case 'uninstall':
        // Perform cleanup logic
        break;
      default:
        // Unknown event type
        break;
    }

    return {
      success: true,
      message: `Successfully handled ${event} event`,
    };
  },
};

// ============================================================================
// Singleton Instance
// ============================================================================

let globalManager: ExtensionLifecycleManager | null = null;

/**
 * Get the global extension lifecycle manager instance.
 */
export function getExtensionLifecycleManager(): ExtensionLifecycleManager {
  if (!globalManager) {
    globalManager = new ExtensionLifecycleManager();
  }
  return globalManager;
}

/**
 * Reset the global manager (for testing).
 */
export function resetExtensionLifecycleManager(): void {
  globalManager = null;
}
