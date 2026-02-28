/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  IModelHandler,
  IToolCallTextParser,
  ToolCallParseResult,
  ParsedToolCall,
  ModelHandlerConfig as ModelHandlerConfigType,
} from './types.js';

// Re-export ModelHandlerConfig for convenience
export type ModelHandlerConfig = ModelHandlerConfigType;
import { defaultParsers } from './default/parsers.js';

/**
 * Options for creating a model handler.
 */
export interface CreateModelHandlerOptions {
  /** Custom parsers for this model (will be merged with default parsers) */
  parsers?: IToolCallTextParser[];
  /** Whether to include default parsers (default: true) */
  includeDefaultParsers?: boolean;
  /** Custom supportsTools logic */
  supportsToolsFn?: (modelName: string) => boolean;
  /** Patterns for models that support tools (alternative to supportsToolsFn) */
  toolsSupportPattern?: RegExp | RegExp[];
}

/**
 * Create a model handler with minimal configuration.
 * Reduces boilerplate for common handler patterns.
 */
export function createModelHandler(
  name: string,
  config: ModelHandlerConfig,
  options?: CreateModelHandlerOptions,
): IModelHandler {
  const includeDefault = options?.includeDefaultParsers !== false;
  const customParsers = options?.parsers ?? [];
  const parsers = includeDefault
    ? [...customParsers, ...defaultParsers]
    : [...customParsers];

  parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

  return {
    name,
    config,

    canHandle(modelName: string): boolean {
      const pattern = config.modelPattern;
      if (typeof pattern === 'string') {
        return modelName.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern.test(modelName);
    },

    supportsTools(modelName: string): boolean {
      if (options?.supportsToolsFn) {
        return options.supportsToolsFn(modelName);
      }
      if (options?.toolsSupportPattern) {
        const patterns = Array.isArray(options.toolsSupportPattern)
          ? options.toolsSupportPattern
          : [options.toolsSupportPattern];
        return patterns.some((p) => p.test(modelName));
      }
      if (config.supportsTools !== undefined) {
        return config.supportsTools;
      }
      return this.canHandle(modelName);
    },

    parseToolCalls(content: string): ToolCallParseResult {
      const allToolCalls: ParsedToolCall[] = [];
      let currentContent = content;

      for (const parser of parsers) {
        if (parser.canParse(currentContent)) {
          const result = parser.parse(currentContent);
          if (result.toolCalls.length > 0) {
            allToolCalls.push(...result.toolCalls);
            currentContent = result.cleanedContent;
          }
        }
      }

      return {
        toolCalls: allToolCalls,
        cleanedContent: currentContent.trim(),
      };
    },
  };
}

/**
 * Base class for model handlers that need custom logic.
 */
export abstract class BaseModelHandler implements IModelHandler {
  abstract readonly name: string;
  abstract readonly config: ModelHandlerConfig;

  protected parsers: IToolCallTextParser[] = [];

  canHandle(modelName: string): boolean {
    const pattern = this.config.modelPattern;
    if (typeof pattern === 'string') {
      return modelName.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(modelName);
  }

  supportsTools(modelName: string): boolean {
    return this.config.supportsTools ?? this.canHandle(modelName);
  }

  parseToolCalls(content: string): ToolCallParseResult {
    const allToolCalls: ParsedToolCall[] = [];
    let currentContent = content;

    for (const parser of this.parsers) {
      if (parser.canParse(currentContent)) {
        const result = parser.parse(currentContent);
        if (result.toolCalls.length > 0) {
          allToolCalls.push(...result.toolCalls);
          currentContent = result.cleanedContent;
        }
      }
    }

    return {
      toolCalls: allToolCalls,
      cleanedContent: currentContent.trim(),
    };
  }
}

/**
 * Base class for tool call text parsers.
 */
export abstract class BaseToolCallParser implements IToolCallTextParser {
  abstract readonly name: string;
  readonly priority?: number = 100;

  abstract canParse(content: string): boolean;
  abstract parse(content: string): ToolCallParseResult;
}
