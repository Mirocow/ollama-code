/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { mistralParsers } from './parsers.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * Mistral model handler.
 *
 * Supports Mistral AI models:
 * - mistral (mistral-small, mistral-medium, mistral-large)
 * - codestral (code-focused model)
 * - mixtral (mixture of experts)
 *
 * Mistral models typically return tool calls in structured format,
 * but may also output in [TOOL_CALLS] text format.
 */
export class MistralModelHandler implements IModelHandler {
  readonly name = 'mistral';
  readonly config: ModelHandlerConfig = {
    modelPattern: /mistral|mixtral|codestral/i,
    displayName: 'Mistral',
    description: 'Mistral AI models (mistral, mixtral, codestral)',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    maxContextLength: 128000, // mistral-large
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...mistralParsers, ...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    const pattern = this.config.modelPattern;
    if (typeof pattern === 'string') {
      return modelName.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(modelName);
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
