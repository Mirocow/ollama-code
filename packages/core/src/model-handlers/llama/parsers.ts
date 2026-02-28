/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Llama-specific tool call parsers.
 *
 * Llama models typically use:
 * - Structured tool_calls when supported
 * - Various JSON formats when in text mode
 */

import type {
  IToolCallTextParser,
  ToolCallParseResult,
  ParsedToolCall,
} from '../types.js';
import { createDebugLogger } from '../../utils/debugLogger.js';

const debugLogger = createDebugLogger('LLAMA_PARSER');

/**
 * Parser for Llama's function call format.
 *
 * Llama may output: {"type": "function", "function": {"name": "...", "arguments": "..."}}
 */
export class LlamaFunctionCallParser implements IToolCallTextParser {
  readonly name = 'llama-function-call';
  readonly priority = 5;

  canParse(content: string): boolean {
    return content.includes('"type"') && content.includes('"function"');
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    let searchPos = 0;

    while (searchPos < cleanedContent.length) {
      const jsonStart = cleanedContent.indexOf('{', searchPos);
      if (jsonStart === -1) break;

      const result = this.tryParseJsonAt(cleanedContent, jsonStart);
      if (result) {
        const parsed = result.json as Record<string, unknown>;
        if (parsed['type'] === 'function' && parsed['function']) {
          const func = parsed['function'] as Record<string, unknown>;
          if (func['name'] && typeof func['name'] === 'string') {
            let args = {};
            if (typeof func['arguments'] === 'string') {
              try {
                args = JSON.parse(func['arguments']);
              } catch {
                args = {};
              }
            } else if (typeof func['arguments'] === 'object') {
              args = func['arguments'] as Record<string, unknown>;
            }
            const toolCall: ParsedToolCall = {
              name: func['name'] as string,
              args,
            };
            debugLogger.debug('Parsed function call', {
              name: toolCall.name,
              args: toolCall.args,
            });
            toolCalls.push(toolCall);
            cleanedContent =
              cleanedContent.slice(0, jsonStart) +
              cleanedContent.slice(result.end + 1);
            searchPos = jsonStart;
            continue;
          }
        }
      }
      searchPos = jsonStart + 1;
    }

    if (toolCalls.length > 0) {
      debugLogger.info('LlamaFunctionCallParser result', {
        count: toolCalls.length,
        toolCalls: toolCalls.map((tc) => ({ name: tc.name, args: tc.args })),
      });
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }

  private findMatchingBrace(str: string, start: number): number {
    if (str[start] !== '{') return -1;
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = start; i < str.length; i++) {
      const char = str[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\' && inString) {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) return i;
        }
      }
    }
    return -1;
  }

  private tryParseJsonAt(
    str: string,
    start: number,
  ): { json: unknown; end: number } | null {
    if (str[start] !== '{') return null;
    const end = this.findMatchingBrace(str, start);
    if (end === -1) return null;
    try {
      return { json: JSON.parse(str.slice(start, end + 1)), end };
    } catch {
      return null;
    }
  }
}

/**
 * All Llama-specific parsers.
 */
export const llamaParsers: IToolCallTextParser[] = [
  new LlamaFunctionCallParser(),
];
