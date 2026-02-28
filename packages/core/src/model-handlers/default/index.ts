/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from './parsers.js';

/**
 * Default model handler.
 *
 * This handler is used when no specific model handler matches.
 * It includes parsers for all common tool call formats.
 */
export class DefaultModelHandler implements IModelHandler {
  readonly name = 'default';
  readonly config: ModelHandlerConfig = {
    modelPattern: /.*/, // Matches any model
    displayName: 'Default',
    description: 'Default handler with common tool call formats',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...defaultParsers];
  }

  /**
   * Always returns true - this is the default handler.
   */
  canHandle(_modelName: string): boolean {
    return true;
  }

  /**
   * Parse tool calls using all default parsers.
   */
  parseToolCalls(content: string): ToolCallParseResult {
    const allToolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
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
