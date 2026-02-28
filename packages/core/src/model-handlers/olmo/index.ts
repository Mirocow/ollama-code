/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * OLMo model handler.
 *
 * Supports AllenAI OLMo models:
 * - olmo, olmo-2, olmo-instruct
 *
 * OLMo (Open Language Model) is a fully open-source LLM from AllenAI,
 * designed for research and transparency in AI.
 */
export class OlmoModelHandler implements IModelHandler {
  readonly name = 'olmo';
  readonly config: ModelHandlerConfig = {
    modelPattern: /olmo/i,
    displayName: 'OLMo',
    description: 'AllenAI OLMo open language models',
    supportsStructuredToolCalls: false,
    supportsTextToolCalls: true,
    supportsTools: true,
    maxContextLength: 4096,
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    return this.config.modelPattern.test(modelName);
  }

  supportsTools(modelName: string): boolean {
    const name = modelName.toLowerCase();
    // OLMo 2 has improved tool support
    if (/olmo[-_]?2/i.test(name)) return true;
    // OLMo Instruct variants support tools
    if (/olmo.*instruct/i.test(name)) return true;
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
