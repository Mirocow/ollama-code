/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * Granite model handler.
 *
 * Supports IBM Granite models:
 * - granite-3b, granite-7b, granite-13b, granite-34b
 * - granite-code
 * - granite-instruct
 *
 * Granite models are enterprise-focused with strong tool calling support.
 */
export class GraniteModelHandler implements IModelHandler {
  readonly name = 'granite';
  readonly config: ModelHandlerConfig = {
    modelPattern: /granite/i,
    displayName: 'Granite',
    description: 'IBM Granite models',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: true,
    maxContextLength: 128000,
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
    const name = modelName.toLowerCase();

    // Granite Code - supports tools for code tasks
    if (/granite[-_]?code/i.test(name)) return true;

    // Granite Instruct - supports tools
    if (/granite[-_]?instruct/i.test(name)) return true;

    // Granite 3.0+ - supports tools
    if (/granite[-_]?3/i.test(name)) return true;

    // Granite with instruct tag
    if (/granite/i.test(name) && /instruct/i.test(name)) return true;

    // Base Granite - no tools
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
