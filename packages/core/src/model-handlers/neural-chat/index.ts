/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * Neural Chat model handler.
 *
 * Supports Intel Neural Chat models:
 * - neural-chat, neural-chat-7b, neural-chat-v3
 *
 * Neural Chat is a fine-tuned model from Intel optimized for
 * conversational AI and chat applications.
 */
export class NeuralChatModelHandler implements IModelHandler {
  readonly name = 'neural-chat';
  readonly config: ModelHandlerConfig = {
    modelPattern: /neural[-_]?chat/i,
    displayName: 'Neural Chat',
    description: 'Intel Neural Chat models',
    supportsStructuredToolCalls: false,
    supportsTextToolCalls: true,
    supportsTools: true,
    maxContextLength: 8192,
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
    // Neural Chat v3+ supports tools
    if (/neural[-_]?chat.*v[-_]?3/i.test(name)) return true;
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
