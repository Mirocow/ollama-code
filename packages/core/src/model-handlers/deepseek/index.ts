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
import { deepseekParsers } from './parsers.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * DeepSeek model handler.
 *
 * Supports DeepSeek models:
 * - deepseek-coder
 * - deepseek-r1 (reasoning model with <think tags)
 *
 * DeepSeek R1 is a reasoning model that outputs thinking in <think...> tags.
 * Tool calls may be embedded in the thinking output.
 */
export class DeepSeekModelHandler implements IModelHandler {
  readonly name = 'deepseek';
  readonly config: ModelHandlerConfig = {
    modelPattern: /deepseek/i,
    displayName: 'DeepSeek',
    description: 'DeepSeek models (deepseek-coder, deepseek-r1)',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: true,
    supportsThinking: true, // DeepSeek R1 supports thinking
    maxContextLength: 128000,
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...deepseekParsers, ...defaultParsers];
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

    // DeepSeek Coder V2 - supports tools
    if (/deepseek[-_]?coder[-_]?v?2/i.test(name)) return true;

    // DeepSeek Coder (older) - limited tool support
    if (/deepseek[-_]?coder/i.test(name)) {
      // V1 has limited support, but works
      return true;
    }

    // DeepSeek R1 - reasoning model, supports tools
    if (/deepseek[-_]?r1/i.test(name)) return true;

    // DeepSeek V3 - supports tools
    if (/deepseek[-_]?v?3/i.test(name)) return true;

    // DeepSeek V2.5 - supports tools
    if (/deepseek[-_]?v?2\.?5/i.test(name)) return true;

    // Generic DeepSeek - assume no tools for base models
    if (/deepseek/i.test(name)) {
      return /instruct|chat/i.test(name);
    }

    return false;
  }

  supportsThinking(modelName: string): boolean {
    const name = modelName.toLowerCase();
    // DeepSeek R1 is a reasoning model with <think tags
    return /deepseek[-_]?r1/i.test(name);
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
