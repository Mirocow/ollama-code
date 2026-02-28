/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * LLaVA model handler.
 *
 * Supports LLaVA multimodal vision-language models:
 * - llava (llava-7b, llava-13b)
 * - llava-v1.5
 * - llava-v1.6 (llava-next)
 * - llava-llama3
 * - bakllava
 * - moondream (related vision model)
 * - minicpm-v (vision model)
 *
 * Vision models focus on image understanding and typically don't support tool calling.
 */
export class LlavaModelHandler implements IModelHandler {
  readonly name = 'llava';
  readonly config: ModelHandlerConfig = {
    modelPattern: /llava|bakllava|moondream|minicpm-v/i,
    displayName: 'LLaVA',
    description: 'LLaVA multimodal vision-language models',
    supportsStructuredToolCalls: false,
    supportsTextToolCalls: false,
    supportsTools: false, // Vision models typically don't support tools
    maxContextLength: 8192, // Varies by base model
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
    // Vision models are primarily for image understanding
    // They don't typically support function calling
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
