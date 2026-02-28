/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * Yi model handler.
 *
 * Supports 01.ai Yi models:
 * - yi (yi-6b, yi-9b, yi-34b)
 * - yi-chat
 * - yi-coder
 * - yi-large
 *
 * Yi models are known for strong reasoning and Chinese/English bilingual support.
 * Yi-Coder and Yi-Large support function calling.
 */
export class YiModelHandler implements IModelHandler {
  readonly name = 'yi';
  readonly config: ModelHandlerConfig = {
    modelPattern: /\byi\b/i,
    displayName: 'Yi',
    description: '01.ai Yi models (yi, yi-chat, yi-coder, yi-large)',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: false, // Determined per model
    maxContextLength: 200000, // yi-large
  };

  private parsers: IToolCallTextParser[];

  constructor() {
    this.parsers = [...defaultParsers];
    this.parsers.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  canHandle(modelName: string): boolean {
    // Match yi but not yi- in other model names (like yi- prefix in different contexts)
    return /\byi\b/i.test(modelName) || /^yi[-_]?/i.test(modelName);
  }

  supportsTools(modelName: string): boolean {
    const name = modelName.toLowerCase();

    // Yi-Coder - supports function calling
    if (/yi[-_]?coder/i.test(name)) return true;

    // Yi-Large - supports function calling
    if (/yi[-_]?large/i.test(name)) return true;

    // Yi-Chat variants - support tools
    if (/yi[-_]?chat/i.test(name)) return true;

    // Yi 1.5+ with instruct
    if (/yi[-_]?1\.?5/i.test(name)) {
      return /instruct|chat/i.test(name);
    }

    // Base Yi models - no native tools
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
