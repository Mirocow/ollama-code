/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * StarCoder model handler.
 *
 * Supports code generation models:
 * - starcoder (starcoder-1, starcoder-2)
 * - starcoder2
 * - stable-code
 * - codeqwen (redirected to Qwen handler)
 * - codellama (redirected to Llama handler)
 *
 * Code models have limited tool calling support - mainly focused on code generation.
 */
export class StarCoderModelHandler implements IModelHandler {
  readonly name = 'starcoder';
  readonly config: ModelHandlerConfig = {
    modelPattern: /starcoder|stable[-_]?code/i,
    displayName: 'StarCoder',
    description: 'Code generation models (starcoder, starcoder2, stable-code)',
    supportsStructuredToolCalls: false,
    supportsTextToolCalls: true,
    supportsTools: false, // Code models typically don't support tools
    maxContextLength: 16384,
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    const pattern = this.config.modelPattern;
    return pattern instanceof RegExp
      ? pattern.test(modelName)
      : new RegExp(pattern).test(modelName);
  }

  supportsTools(modelName: string): boolean {
    // StarCoder models are code-focused, limited tool support
    const name = modelName.toLowerCase();

    // StarCoder2 may have limited tool support
    if (/starcoder[-_]?2/i.test(name)) return false;

    // Stable Code - no tools
    if (/stable[-_]?code/i.test(name)) return false;

    return false;
  }

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
