/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  IModelHandler,
  ToolCallParseResult,
  ModelHandlerConfig,
  IToolCallTextParser,
} from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * Command model handler.
 *
 * Supports Cohere Command models:
 * - command-r (optimized for RAG and tools)
 * - command-r-plus (larger, better tool calling)
 * - command (general purpose)
 *
 * Command-R models are specifically designed for tool use and RAG.
 */
export class CommandModelHandler implements IModelHandler {
  readonly name = 'command';
  readonly config: ModelHandlerConfig = {
    modelPattern: /command/i,
    displayName: 'Command',
    description: 'Cohere Command models (command-r, command-r-plus)',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: true,
    maxContextLength: 128000, // command-r-plus
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    const pattern = this.config.modelPattern;
    if (typeof pattern === 'string') {
      return modelName.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(modelName);
  }

  supportsTools(modelName: string): boolean {
    const name = modelName.toLowerCase();

    // Command-R Plus - best tool calling
    if (/command[-_]?r[-_]?plus/i.test(name)) return true;

    // Command-R - optimized for tools
    if (/command[-_]?r/i.test(name)) return true;

    // Command (base) - supports tools but not optimized
    if (/command$/i.test(name) || /command-light/i.test(name)) {
      return true;
    }

    // Default for Command family
    return true;
  }

  parseToolCalls(content: string): ToolCallParseResult {
    const allToolCalls: Array<{ name: string; args: Record<string, unknown> }> =
      [];
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
