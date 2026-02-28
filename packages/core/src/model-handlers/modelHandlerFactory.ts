/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult } from './types.js';
import { DefaultModelHandler } from './default/index.js';
import { QwenModelHandler } from './qwen/index.js';
import { LlamaModelHandler } from './llama/index.js';
import { DeepSeekModelHandler } from './deepseek/index.js';
import { MistralModelHandler } from './mistral/index.js';
import { GemmaModelHandler } from './gemma/index.js';
import { PhiModelHandler } from './phi/index.js';
import { CommandModelHandler } from './command/index.js';
import { YiModelHandler } from './yi/index.js';
import { LlavaModelHandler } from './llava/index.js';
import { SolarModelHandler } from './solar/index.js';
import { StarCoderModelHandler } from './starcoder/index.js';
import { DbrxModelHandler } from './dbrx/index.js';
import { GraniteModelHandler } from './granite/index.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('MODEL_HANDLER_FACTORY');

/**
 * Factory for managing model-specific handlers.
 *
 * This factory implements a chain-of-responsibility pattern where each
 * handler is checked in order until one can handle the given model.
 *
 * New handlers can be registered to support additional model families.
 *
 * @example
 * ```typescript
 * const factory = ModelHandlerFactory.createDefault();
 *
 * // Get handler for a model
 * const handler = factory.getHandler('qwen3-coder:30b');
 *
 * // Parse tool calls
 * const result = handler.parseToolCalls(content);
 *
 * // Register a custom handler
 * factory.register(new MyCustomHandler());
 * ```
 */
export class ModelHandlerFactory {
  private handlers: IModelHandler[] = [];
  private defaultHandler: IModelHandler | null = null;
  private initialized = false;

  private constructor() {}

  /**
   * Create a factory with default handlers.
   */
  static createDefault(): ModelHandlerFactory {
    const factory = new ModelHandlerFactory();
    factory.initializeHandlers();
    return factory;
  }

  /**
   * Initialize factory with all built-in handlers.
   */
  private initializeHandlers(): void {
    if (this.initialized) return;

    // Register handlers (order matters - more specific first)
    // Code/Tool-focused models
    this.register(new QwenModelHandler());
    this.register(new DeepSeekModelHandler());
    this.register(new CommandModelHandler());

    // General purpose models
    this.register(new MistralModelHandler());
    this.register(new GemmaModelHandler());
    this.register(new PhiModelHandler());
    this.register(new YiModelHandler());
    this.register(new GraniteModelHandler());
    this.register(new DbrxModelHandler());
    this.register(new SolarModelHandler());

    // Code-specific models
    this.register(new StarCoderModelHandler());

    // Vision models (least likely to have tools)
    this.register(new LlavaModelHandler());

    // Llama family (most common, register last for specific models)
    this.register(new LlamaModelHandler());

    // Set default handler (used when no specific handler matches)
    this.defaultHandler = new DefaultModelHandler();

    this.initialized = true;

    debugLogger.info('Initialized model handlers', {
      handlers: this.handlers.map((h) => h.name),
      defaultHandler: this.defaultHandler.name,
    });
  }

  /**
   * Create an empty factory without any handlers.
   */
  static createEmpty(): ModelHandlerFactory {
    return new ModelHandlerFactory();
  }

  /**
   * Register a new model handler.
   * Handlers are checked in order of registration.
   *
   * @param handler - The handler to register
   */
  register(handler: IModelHandler): void {
    this.handlers.push(handler);
    debugLogger.debug('Registered model handler', {
      name: handler.name,
      pattern: handler.config.modelPattern.toString(),
    });
  }

  /**
   * Unregister a handler by name.
   *
   * @param name - The name of the handler to remove
   * @returns true if handler was found and removed
   */
  unregister(name: string): boolean {
    const index = this.handlers.findIndex((h) => h.name === name);
    if (index !== -1) {
      this.handlers.splice(index, 1);
      debugLogger.debug('Unregistered model handler', { name });
      return true;
    }
    return false;
  }

  /**
   * Set the default handler.
   * This handler is used when no specific handler matches.
   *
   * @param handler - The default handler
   */
  setDefaultHandler(handler: IModelHandler): void {
    this.defaultHandler = handler;
    debugLogger.debug('Set default handler', { name: handler.name });
  }

  /**
   * Get a handler for the given model.
   * Returns the first handler that can handle the model,
   * or the default handler if none match.
   *
   * @param modelName - The model name to get a handler for
   * @returns The appropriate handler
   */
  getHandler(modelName: string): IModelHandler {
    if (!this.initialized) {
      this.initializeHandlers();
    }

    for (const handler of this.handlers) {
      if (handler.canHandle(modelName)) {
        debugLogger.debug('Found handler for model', {
          model: modelName,
          handler: handler.name,
        });
        return handler;
      }
    }

    debugLogger.debug('Using default handler for model', {
      model: modelName,
      handler: this.defaultHandler?.name ?? 'none',
    });

    return this.defaultHandler!;
  }

  /**
   * Parse tool calls using the appropriate handler for the model.
   *
   * @param modelName - The model name
   * @param content - The text content to parse
   * @returns Parsed tool calls and cleaned content
   */
  parseToolCalls(modelName: string, content: string): ToolCallParseResult {
    const handler = this.getHandler(modelName);
    return handler.parseToolCalls(content);
  }

  /**
   * Check if a model supports function calling (tools).
   * Uses the handler's supportsTools method if available,
   * otherwise falls back to the handler's config.
   *
   * @param modelName - The model name to check
   * @returns true if the model supports tools
   */
  supportsTools(modelName: string): boolean {
    const handler = this.getHandler(modelName);

    // Use handler's supportsTools method if available
    if (handler.supportsTools) {
      const result = handler.supportsTools(modelName);
      debugLogger.debug('supportsTools check', {
        model: modelName,
        handler: handler.name,
        result,
      });
      return result;
    }

    // Fallback to config.supportsTools
    const result = handler.config.supportsTools ?? false;
    debugLogger.debug('supportsTools check (from config)', {
      model: modelName,
      handler: handler.name,
      result,
    });
    return result;
  }

  /**
   * Get list of registered handler names.
   */
  getHandlerNames(): string[] {
    return this.handlers.map((h) => h.name);
  }

  /**
   * Get all registered handlers.
   */
  getHandlers(): IModelHandler[] {
    return [...this.handlers];
  }
}

// Singleton instance
let defaultFactory: ModelHandlerFactory | null = null;

/**
 * Get the default factory instance.
 * Creates one if it doesn't exist.
 */
export function getModelHandlerFactory(): ModelHandlerFactory {
  if (!defaultFactory) {
    defaultFactory = ModelHandlerFactory.createDefault();
  }
  return defaultFactory;
}

/**
 * Reset the default factory (useful for testing).
 */
export function resetModelHandlerFactory(): void {
  defaultFactory = null;
}
