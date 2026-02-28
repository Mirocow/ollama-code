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
 * Gemma model handler.
 *
 * Supports Google Gemma models:
 * - gemma (gemma-2-2b, gemma-2-9b, gemma-2-27b)
 * - gemma-3 (latest generation)
 * - codegemma (code-focused variant)
 *
 * Gemma models have limited tool calling support:
 * - Gemma 2: No native tool calling (but can follow JSON format)
 * - Gemma 3: Added tool calling support
 * - CodeGemma: Limited tool calling for code tasks
 */
export class GemmaModelHandler implements IModelHandler {
  readonly name = 'gemma';
  readonly config: ModelHandlerConfig = {
    modelPattern: /gemma/i,
    displayName: 'Gemma',
    description: 'Google Gemma models (gemma-2, gemma-3, codegemma)',
    supportsStructuredToolCalls: false, // Only Gemma 3 supports this
    supportsTextToolCalls: true,
    supportsTools: false, // Determined per model
    maxContextLength: 8192, // Varies by model (up to 32K for some)
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

    // Gemma 3 - supports tool calling
    if (/gemma[-_]?3/i.test(name)) return true;

    // CodeGemma - limited tool support for code tasks
    if (/codegemma/i.test(name)) return true;

    // Gemma 2 instruct - no native tools, but can follow format
    // Most use cases require workarounds
    if (/gemma[-_]?2/i.test(name)) {
      return /it|instruct/i.test(name);
    }

    // Gemma 1 - no tool support
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
