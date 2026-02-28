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
import { qwenParsers } from './parsers.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * Qwen model handler.
 *
 * Supports Qwen models from Alibaba:
 * - qwen2.5-coder
 * - qwen3-coder
 * - qwen3
 * - qwq
 *
 * Qwen models may return tool calls in:
 * - Structured format (tool_calls field)
 * - Text format: <tool_call=...>
 * - Text format inside <think...> tags (Qwen3)
 */
export class QwenModelHandler implements IModelHandler {
  readonly name = 'qwen';
  readonly config: ModelHandlerConfig = {
    modelPattern: /qwen|qwq/i,
    displayName: 'Qwen',
    description: 'Alibaba Qwen models (qwen2.5, qwen3, qwq)',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: true,
    maxContextLength: 128000, // Varies by model
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    // Qwen-specific parsers first, then default parsers as fallback
    this.parsers = [...qwenParsers, ...defaultParsers];
    // Sort by priority
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

    // Qwen2.5-Coder: all versions support tools
    if (/qwen[-_]?2\.?5[-_]?coder/i.test(name)) return true;

    // Qwen3-Coder: all versions support tools
    if (/qwen[-_]?3[-_]?coder/i.test(name)) return true;

    // Qwen3 with explicit tools tag
    if (/qwen[-_]?3[-_]?tools/i.test(name)) return true;

    // QwQ (reasoning models) - support tools
    if (/qwq/i.test(name)) return true;

    // Qwen2.5 base (not all support tools, need instruct variant)
    if (/qwen[-_]?2\.?5/i.test(name)) {
      // Instruct variants support tools
      if (/instruct/i.test(name)) return true;
      // Without instruct, assume no tools
      return false;
    }

    // Qwen3 base
    if (/qwen[-_]?3/i.test(name)) {
      // Most Qwen3 models support tools
      return true;
    }

    // Default: assume Qwen models with instruct or tools tags support tools
    if (/instruct|tools/i.test(name)) return true;

    // Unknown Qwen variant - conservative
    return false;
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
