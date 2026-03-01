/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mistral-specific tool call parsers.
 *
 * Mistral models (mistral, mistral-small, mistral-medium, mistral-large, codestral, mixtral)
 * typically use structured tool calls, but may also output in text format.
 *
 * Known formats:
 * - Standard OpenAI-compatible function calls
 * - [TOOL_CALLS] [...] format in some versions
 */

import type {
  IToolCallTextParser,
  ToolCallParseResult,
  ParsedToolCall,
} from '../types.js';
import { tryParseArrayAt, extractToolCall } from '../utils/parserUtils.js';

/**
 * Parser for Mistral's [TOOL_CALLS] format.
 *
 * Example: [TOOL_CALLS] [{"name": "get_weather", "arguments": {"location": "Paris"}}]
 */
export class MistralToolCallsBracketParser implements IToolCallTextParser {
  readonly name = 'mistral-tool-calls-bracket';
  readonly priority = 5; // Higher priority

  canParse(content: string): boolean {
    return /\[TOOL_CALLS\]/i.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    const pattern = /\[TOOL_CALLS\]\s*(\[[\s\S]*?\])/gi;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const result = tryParseArrayAt(match[1], 0);
      if (result) {
        for (const item of result.array) {
          const toolCall = extractToolCall(item);
          if (toolCall) {
            toolCalls.push(toolCall);
          }
        }
        cleanedContent = cleanedContent.replace(match[0], '');
      }
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * All Mistral-specific parsers.
 * Note: Markdown code blocks are handled by MarkdownCodeBlockParser in defaultParsers.
 */
export const mistralParsers: IToolCallTextParser[] = [
  new MistralToolCallsBracketParser(),
];
