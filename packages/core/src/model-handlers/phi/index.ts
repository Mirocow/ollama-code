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
 * Phi model handler.
 *
 * Supports Microsoft Phi models:
 * - phi-2 (older, limited tool support)
 * - phi-3 (mini, small, medium)
 * - phi-3.5
 * - phi-4 (latest with improved tool calling)
 *
 * Phi-3 and later models have native function calling support.
 */
export class PhiModelHandler implements IModelHandler {
  readonly name = 'phi';
  readonly config: ModelHandlerConfig = {
    modelPattern: /phi/i,
    displayName: 'Phi',
    description: 'Microsoft Phi models (phi-2, phi-3, phi-4)',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: false, // Determined per model
    maxContextLength: 128000, // phi-3-medium
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

    // Phi-4 - excellent tool calling
    if (/phi[-_]?4/i.test(name)) return true;

    // Phi-3.5 - supports tools
    if (/phi[-_]?3\.?5/i.test(name)) return true;

    // Phi-3 mini/small/medium - support tools
    if (/phi[-_]?3/i.test(name)) {
      // All phi-3 variants support function calling
      return true;
    }

    // Phi-2 - no native tool support
    if (/phi[-_]?2/i.test(name)) return false;

    // Default for unknown Phi variants
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
