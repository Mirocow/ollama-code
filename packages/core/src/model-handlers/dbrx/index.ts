/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IModelHandler, ToolCallParseResult, ModelHandlerConfig, IToolCallTextParser } from '../types.js';
import { defaultParsers } from '../default/parsers.js';

/**
 * DBRX model handler.
 *
 * Supports Databricks DBRX models:
 * - dbrx (dbrx-instruct)
 *
 * DBRX is a large MoE model optimized for enterprise use with strong tool calling support.
 */
export class DbrxModelHandler implements IModelHandler {
  readonly name = 'dbrx';
  readonly config: ModelHandlerConfig = {
    modelPattern: /dbrx/i,
    displayName: 'DBRX',
    description: 'Databricks DBRX models',
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
    const pattern = this.config.modelPattern;
    return pattern instanceof RegExp
      ? pattern.test(modelName)
      : new RegExp(pattern).test(modelName);
  }

  supportsTools(modelName: string): boolean {
    const name = modelName.toLowerCase();

    // DBRX Instruct - supports tools
    if (/dbrx[-_]?instruct/i.test(name)) return true;

    // Base DBRX with instruct tag
    if (/dbrx/i.test(name) && /instruct/i.test(name)) return true;

    // Base DBRX - limited tools
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
