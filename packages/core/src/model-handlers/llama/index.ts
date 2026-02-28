/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { llamaParsers } from './parsers.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * Llama model handler.
 *
 * Supports Llama models from Meta:
 * - llama3.1
 * - llama3.2
 * - llama3.3
 * - codellama
 *
 * Llama models typically return tool calls in structured format,
 * but may also output JSON in text format.
 */
export class LlamaModelHandler implements IModelHandler {
  readonly name = 'llama';
  readonly config: ModelHandlerConfig = {
    modelPattern: /llama|codellama/i,
    displayName: 'Llama',
    description: 'Meta Llama models (llama3, codellama)',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: true, // llama3.1+ supports tools
    maxContextLength: 128000, // llama3.1
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...llamaParsers, ...defaultParsers];
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
    // Only llama3.1+ supports tools
    // llama3, llama2, and original llama don't support structured tools
    if (/llama[-_]?3\.[1-9]/i.test(modelName)) return true;
    if (/llama[-_]?3[1-9]/i.test(modelName)) return true;
    if (/codellama/i.test(modelName)) return true;
    // Default: assume llama3.1+ if just "llama3" or similar
    return /llama3/i.test(modelName);
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
