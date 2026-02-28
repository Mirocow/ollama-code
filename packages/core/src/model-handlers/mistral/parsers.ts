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

import type { IToolCallTextParser, ToolCallParseResult, ParsedToolCall } from '../types.js';
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
 * Parser for Mistral's function call in markdown code blocks.
 *
 * Example:
 * ```json
 * {"name": "get_weather", "arguments": {"location": "Paris"}}
 * ```
 */
export class MistralCodeBlockParser implements IToolCallTextParser {
  readonly name = 'mistral-code-block';
  readonly priority = 15;

  canParse(content: string): boolean {
    return /```(?:json)?\s*\n?\s*\{[\s\S]*?"name"[\s\S]*?\n?\s*```/i.test(content);
  }

  parse(content: string): ToolCallParseResult {
    const toolCalls: ParsedToolCall[] = [];
    let cleanedContent = content;
    const pattern = /```(?:json)?\s*\n?([\s\S]*?)\n?```/gi;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      try {
        const jsonStr = match[1].trim();
        if (jsonStr.startsWith('{') && jsonStr.includes('"name"')) {
          const parsed = JSON.parse(jsonStr);
          const toolCall = extractToolCall(parsed);
          if (toolCall) {
            toolCalls.push(toolCall);
            cleanedContent = cleanedContent.replace(match[0], '');
          }
        }
      } catch { /* skip parse errors */ }
    }

    return { toolCalls, cleanedContent: cleanedContent.trim() };
  }
}

/**
 * All Mistral-specific parsers.
 */
export const mistralParsers: IToolCallTextParser[] = [
  new MistralToolCallsBracketParser(),
  new MistralCodeBlockParser(),
];
