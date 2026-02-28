/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * Solar model handler.
 *
 * Supports Upstage Solar models:
 * - solar-10.7b
 * - solar-pro
 *
 * Solar models are optimized for Korean and English, with good tool calling support.
 */
export class SolarModelHandler implements IModelHandler {
  readonly name = 'solar';
  readonly config: ModelHandlerConfig = {
    modelPattern: /solar/i,
    displayName: 'Solar',
    description: 'Upstage Solar models (solar-10.7b, solar-pro)',
    supportsStructuredToolCalls: true,
    supportsTextToolCalls: true,
    supportsTools: true,
    maxContextLength: 32768,
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

    // Solar Pro - supports tools
    if (/solar[-_]?pro/i.test(name)) return true;

    // Solar 10.7B instruct - supports tools
    if (/solar[-_]?10\.?7/i.test(name)) {
      return /instruct/i.test(name);
    }

    // Base Solar models - check for instruct
    return /instruct/i.test(name);
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
